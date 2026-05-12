import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';
import type { CompoundInsight, QuizAnswers, StackMatch } from '@/types/quiz';

const REQUEST_TIMEOUT_MS = 15000;

function apiBaseUrl() {
  const value = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  return value?.replace(/\/$/, '') ?? '';
}

async function apiClientHeaders(): Promise<Record<string, string>> {
  const token = (Constants.expoConfig?.extra?.apiClientToken as string | undefined)?.trim();
  const appUserId = await storage.getItem(STORAGE_KEYS.revenueCatAppUserId).catch(() => null);
  return {
    ...(token ? { 'X-GlowPep-Client-Token': token } : {}),
    ...(appUserId ? { 'X-RevenueCat-App-User-Id': appUserId } : {}),
  };
}

function aiEndpoint() {
  const baseUrl = apiBaseUrl();
  if (baseUrl) {
    return `${baseUrl}/api/ai-insights`;
  }

  if (Platform.OS !== 'web' && !__DEV__) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL for production AI insights.');
  }

  if (Platform.OS !== 'web') {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (typeof hostUri === 'string' && hostUri.length > 0) {
      return `http://${hostUri.replace(/\/$/, '')}/api/ai-insights`;
    }
  }

  return '/api/ai-insights';
}

async function postAi<T>(body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(aiEndpoint(), {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(await apiClientHeaders()),
        'X-Request-Id': `ai_${Date.now().toString(36)}`,
      },
      method: 'POST',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isAiConfigured(): boolean {
  // The client no longer knows whether the server-side key is present.
  // Attempt the API call and let the route fail closed if AI is unavailable.
  return true;
}

export async function fetchAiInsights(
  answers: QuizAnswers,
  matches: StackMatch[],
): Promise<CompoundInsight[]> {
  const payload = await postAi<{ insights: CompoundInsight[] }>({
    action: 'stack-insights',
    answers,
    matches,
  });
  return payload.insights;
}

export interface CompoundExplanation {
  compoundId: string;
  explanation: string;
  practicalTips: string[];
  watchOutFor: string[];
}

export async function fetchCompoundExplanation(
  answers: QuizAnswers,
  compoundId: string,
  matches: StackMatch[],
): Promise<CompoundExplanation> {
  const payload = await postAi<{ explanation: CompoundExplanation }>({
    action: 'compound-explanation',
    answers,
    compoundId,
    matches,
  });
  return payload.explanation;
}

export async function regenerateInsights(
  answers: QuizAnswers,
  matches: StackMatch[],
  previousInsights: CompoundInsight[],
): Promise<CompoundInsight[]> {
  const payload = await postAi<{ insights: CompoundInsight[] }>({
    action: 'regenerate-insights',
    answers,
    matches,
    previousInsights,
  });
  return payload.insights;
}
