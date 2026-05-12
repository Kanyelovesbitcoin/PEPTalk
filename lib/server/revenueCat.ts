import { jsonResponse } from '@/lib/server/apiSecurity';

const REVENUECAT_API_BASE_URL = 'https://api.revenuecat.com/v1';
const ENTITLEMENT_ID =
  process.env.REVENUECAT_ENTITLEMENT_ID ||
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ||
  'glowpep_pro';
const REQUEST_TIMEOUT_MS = 8000;
const APP_USER_ID_MAX_LENGTH = 128;

function revenueCatApiKey() {
  return (process.env.REVENUECAT_REST_API_KEY || process.env.REVENUECAT_API_KEY || '').trim();
}

function activeEntitlement(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entitlement = value as {
    expires_date?: string | null;
    grace_period_expires_date?: string | null;
  };
  const now = Date.now();
  const expiresAt = entitlement.expires_date ? Date.parse(entitlement.expires_date) : null;
  const graceExpiresAt = entitlement.grace_period_expires_date ? Date.parse(entitlement.grace_period_expires_date) : null;

  return (
    entitlement.expires_date === null ||
    (typeof expiresAt === 'number' && Number.isFinite(expiresAt) && expiresAt > now) ||
    (typeof graceExpiresAt === 'number' && Number.isFinite(graceExpiresAt) && graceExpiresAt > now)
  );
}

function appUserIdFromRequest(request: Request) {
  const value = request.headers.get('x-revenuecat-app-user-id')?.trim() ?? '';
  if (!value || value.length > APP_USER_ID_MAX_LENGTH || !/^[\w:.$@-]+$/.test(value)) {
    return null;
  }
  return value;
}

export function hasRevenueCatServerKey() {
  return Boolean(revenueCatApiKey());
}

export async function verifyRevenueCatEntitlement(appUserId: string) {
  const apiKey = revenueCatApiKey();
  if (!apiKey) {
    return { checked: false, isPro: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${REVENUECAT_API_BASE_URL}/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return { checked: true, isPro: false };
    }

    const payload = await response.json();
    const subscriber = payload?.subscriber ?? payload?.value?.subscriber;
    const entitlement = subscriber?.entitlements?.[ENTITLEMENT_ID];

    return { checked: true, isPro: activeEntitlement(entitlement) };
  } catch {
    return { checked: true, isPro: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requireProEntitlement(request: Request): Promise<Response | null> {
  if (!hasRevenueCatServerKey()) {
    return null;
  }

  const appUserId = appUserIdFromRequest(request);
  if (!appUserId) {
    return jsonResponse({ error: 'Pro entitlement could not be verified.' }, 401, undefined, request);
  }

  const result = await verifyRevenueCatEntitlement(appUserId);
  if (result.isPro) {
    return null;
  }

  return jsonResponse({ error: 'Active Pro entitlement required.' }, 402, undefined, request);
}
