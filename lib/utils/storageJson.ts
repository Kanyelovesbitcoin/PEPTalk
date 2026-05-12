import { storage } from '@/lib/utils/storage';

function warnStorage(message: string, error?: unknown) {
  if (__DEV__) {
    console.warn(`[storage] ${message}`, error);
  }
}

export function parseJsonValue<T>(value: string | null, fallback: T, label: string): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    warnStorage(`Could not parse ${label}; using fallback.`, error);
    return fallback;
  }
}

export function parseJsonArray<T>(value: string | null, label: string): T[] {
  const parsed = parseJsonValue<unknown>(value, [], label);

  if (Array.isArray(parsed)) {
    return parsed as T[];
  }

  warnStorage(`Expected ${label} to be an array; using empty array.`);
  return [];
}

export function parseJsonObject<T extends Record<string, unknown>>(
  value: string | null,
  label: string,
): T {
  const parsed = parseJsonValue<unknown>(value, {}, label);

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as T;
  }

  warnStorage(`Expected ${label} to be an object; using empty object.`);
  return {} as T;
}

export async function setJsonItem(key: string, value: unknown, label = key) {
  try {
    await storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    warnStorage(`Could not persist ${label}.`, error);
  }
}
