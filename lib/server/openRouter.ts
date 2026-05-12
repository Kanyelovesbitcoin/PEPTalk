const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_TEXT_MODEL = 'deepseek/deepseek-v4-flash';
const DEFAULT_VISION_MODEL = 'google/gemini-2.5-flash';

interface OpenRouterMessage {
  role: 'system' | 'user';
  content: unknown;
}

interface OpenRouterOptions {
  maxTokens?: number;
  model?: string;
  responseFormat?: { type: 'json_object' };
  temperature?: number;
  timeoutMs?: number;
}

export function hasOpenRouterKey() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function callOpenRouter(messages: OpenRouterMessage[], options: OpenRouterOptions = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 12000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      body: JSON.stringify({
        max_tokens: options.maxTokens ?? 1024,
        messages,
        model: options.model ?? DEFAULT_TEXT_MODEL,
        response_format: options.responseFormat,
        temperature: options.temperature,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://glowpep.app',
        'X-Title': 'GlowPep',
      },
      method: 'POST',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';
    return typeof raw === 'string'
      ? raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      : JSON.stringify(raw);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function openRouterVisionModel() {
  return process.env.OPENROUTER_VISION_MODEL || DEFAULT_VISION_MODEL;
}
