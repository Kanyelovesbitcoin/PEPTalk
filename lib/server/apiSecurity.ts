interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowMs: number;
}

interface RateBucket {
  count: number;
  resetAt: number;
}

const MAX_RATE_BUCKETS = 5_000;
const CLIENT_KEY_MAX_LENGTH = 96;
const JSON_CONTENT_TYPE = /^application\/(?:[\w.+-]+\+)?json\b/i;
const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:8081',
  'http://localhost:19006',
  'https://glowpep.app',
]);

const buckets = new Map<string, RateBucket>();

function requestId(request?: Request) {
  return (
    request?.headers.get('x-request-id') ||
    request?.headers.get('x-vercel-id') ||
    `gp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  ).slice(0, 96);
}

function allowedOrigins() {
  const configured = process.env.API_ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configured && configured.length > 0 ? new Set(configured) : DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(request?: Request): HeadersInit {
  const origin = request?.headers.get('origin') ?? '';
  if (!origin || !allowedOrigins().has(origin)) {
    return {};
  }

  return {
    'Access-Control-Allow-Headers': 'Content-Type, X-GlowPep-Client-Token, X-Request-Id',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
  };
}

function safeEquals(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export function jsonResponse(body: unknown, status = 200, headers?: HeadersInit, request?: Request) {
  return Response.json(body, {
    headers: {
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Request-Id': requestId(request),
      ...corsHeaders(request),
      ...headers,
    },
    status,
  });
}

export function preflightResponse(request: Request) {
  return new Response(null, {
    headers: {
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
    },
    status: 204,
  });
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const candidate =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    forwardedFor ||
    'unknown';

  return candidate.replace(/[^\w:.:-]/g, '').slice(0, CLIENT_KEY_MAX_LENGTH) || 'unknown';
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function maybePruneBuckets(now: number) {
  if (buckets.size < MAX_RATE_BUCKETS) {
    return;
  }

  pruneExpiredBuckets(now);

  if (buckets.size >= MAX_RATE_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (oldestKey) {
      buckets.delete(oldestKey);
    }
  }
}

export function checkRateLimit(request: Request, options: RateLimitOptions): Response | null {
  const now = Date.now();
  const key = `${options.keyPrefix}:${getClientIp(request)}`;
  maybePruneBuckets(now);

  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return jsonResponse(
      { error: 'Rate limit exceeded. Try again later.' },
      429,
      { 'Retry-After': String(retryAfter) },
      request,
    );
  }

  current.count += 1;
  return null;
}

export function requireClientToken(request: Request): Response | null {
  const expected = process.env.API_CLIENT_TOKEN?.trim();
  if (!expected) {
    return null;
  }

  const provided = request.headers.get('x-glowpep-client-token')?.trim() ?? '';
  if (provided && safeEquals(provided, expected)) {
    return null;
  }

  return jsonResponse({ error: 'Unauthorized request.' }, 401, undefined, request);
}

async function readLimitedText(request: Request, maxBytes: number) {
  const reader = request.body?.getReader();
  if (!reader) {
    const text = await request.text().catch(() => '');
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error('body_too_large');
    }

    return text;
  }

  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    byteLength += value.byteLength;
    if (byteLength > maxBytes) {
      throw new Error('body_too_large');
    }

    chunks.push(value);
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}

export async function readJsonBody<T>(
  request: Request,
  maxBytes: number,
): Promise<{ body: T | null; error?: Response }> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!JSON_CONTENT_TYPE.test(contentType)) {
    return { body: null, error: jsonResponse({ error: 'Content-Type must be application/json.' }, 415, undefined, request) };
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { body: null, error: jsonResponse({ error: 'Request body is too large.' }, 413, undefined, request) };
  }

  let text = '';
  try {
    text = await readLimitedText(request, maxBytes);
  } catch {
    return { body: null, error: jsonResponse({ error: 'Request body is too large.' }, 413, undefined, request) };
  }

  try {
    return { body: JSON.parse(text) as T };
  } catch {
    return { body: null, error: jsonResponse({ error: 'Invalid JSON body.' }, 400, undefined, request) };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function stringValue(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

export function stringArrayValue(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
}
