import type { SkinScan } from '@/lib/storage/skinScans';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface SkinScores {
  collagen: number;
  texture: number;
  luminosity: number;
}

export type SkinAnalysisSource = 'ai' | 'fallback';

export interface AngleInsights {
  front: string;
  left: string;
  right: string;
}

export interface FaceScanImages {
  front: string;
  left: string;
  right: string;
  mimeType?: string;
}

export interface SkinAnalysisResult extends SkinScores {
  angleInsights: AngleInsights;
  feedbackSummary: string;
  improvements: string[];
  recommendedCompoundIds: string[];
  source: SkinAnalysisSource;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// Allowlist for legal cosmetic recommendations surfaced from AI output.
const LEGAL_COSMETIC_IDS = ['ghk-cu', 'matrixyl', 'argireline'];

const DEFAULT_ANGLE_INSIGHTS: AngleInsights = {
  front: 'Front angle saved. Use this view to compare tone, texture, and under-eye brightness over time.',
  left: 'Left profile saved. This angle helps compare cheek, jawline, and side-light texture changes.',
  right: 'Right profile saved. Use it against the left side to spot asymmetry and profile-level changes.',
};

function apiBaseUrl() {
  const value = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  return value?.replace(/\/$/, '') ?? '';
}

function analysisEndpoint() {
  const baseUrl = apiBaseUrl();
  if (baseUrl) {
    return `${baseUrl}/api/skin-analysis`;
  }

  if (Platform.OS !== 'web') {
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (typeof hostUri === 'string' && hostUri.length > 0) {
      return `http://${hostUri.replace(/\/$/, '')}/api/skin-analysis`;
    }
  }

  return '/api/skin-analysis';
}

function sanitizeResult(value: Partial<SkinAnalysisResult> | null | undefined, source: SkinAnalysisSource): SkinAnalysisResult {
  const recommendedCompoundIds = Array.isArray(value?.recommendedCompoundIds)
    ? value.recommendedCompoundIds.filter((id) => LEGAL_COSMETIC_IDS.includes(id)).slice(0, 3)
    : LEGAL_COSMETIC_IDS;

  const improvements = Array.isArray(value?.improvements) && value.improvements.length > 0
    ? value.improvements.map(String).slice(0, 4)
    : [
        'Tighten the basics first: consistent sleep, morning light, hydration, and daily SPF will move the scan more than random products.',
        'For a younger look, prioritize smoother under-eye and forehead texture before adding more advanced routines.',
        'Use legal cosmetic peptides consistently for 8-12 weeks before judging results.',
      ];

  return {
    angleInsights: {
      front: value?.angleInsights?.front || DEFAULT_ANGLE_INSIGHTS.front,
      left: value?.angleInsights?.left || DEFAULT_ANGLE_INSIGHTS.left,
      right: value?.angleInsights?.right || DEFAULT_ANGLE_INSIGHTS.right,
    },
    collagen: clampScore(value?.collagen ?? 70),
    texture: clampScore(value?.texture ?? 70),
    luminosity: clampScore(value?.luminosity ?? 70),
    feedbackSummary: value?.feedbackSummary || 'Your baseline is usable. The biggest win is building a consistent routine around smoother texture, brighter skin, and long-term bounce.',
    improvements,
    recommendedCompoundIds: recommendedCompoundIds.length > 0 ? recommendedCompoundIds : LEGAL_COSMETIC_IDS,
    source,
  };
}

function fallbackAnalysis(images: FaceScanImages): SkinAnalysisResult {
  const seed = `${images.front.length}:${images.left.length}:${images.right.length}`;
  const hash = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  const collagen = 66 + (hash % 16);
  const texture = 64 + ((hash * 3) % 18);
  const luminosity = 65 + ((hash * 5) % 17);

  return sanitizeResult({
    collagen,
    texture,
    luminosity,
    feedbackSummary: 'Three angles are saved. The fallback read suggests you should focus on smoother skin texture, brighter under-eyes, and maintaining youthful bounce with a simple legal cosmetic peptide routine.',
    improvements: [
      'Make Smooth Canvas the first target: keep actives consistent and avoid switching products every few days.',
      'Use morning SPF and evening recovery skincare so your Glow Score is not dragged down by dullness or irritation.',
      'Track left and right profile photos monthly; side angles reveal jawline, under-eye, and cheek changes better than front-only scans.',
      'If you use peptides for a younger look, keep it legal and cosmetic-first: topical GHK-Cu, Matrixyl, or Argireline before anything research-use.',
    ],
    recommendedCompoundIds: ['ghk-cu', 'matrixyl', 'argireline'],
  }, 'fallback');
}

export async function analyzeFaceImages(images: FaceScanImages): Promise<SkinAnalysisResult> {
  try {
    const response = await fetch(analysisEndpoint(), {
      body: JSON.stringify(images),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Skin analysis failed: ${response.status}`);
    }

    const payload = await response.json();
    return sanitizeResult(payload, payload?.source === 'fallback' ? 'fallback' : 'ai');
  } catch (err) {
    console.warn('[scan] face analysis failed, using fallback', err);
    return fallbackAnalysis(images);
  }
}

export function looksROIFromScores(scores: SkinScores): number {
  const base = (scores.collagen + scores.texture + scores.luminosity) / 3;
  return clampScore(base);
}

export function getSkinProgress(scans: SkinScan[]): string {
  if (scans.length < 2) return 'Start with a scan';
  const [latest, previous] = scans;
  const latestAvg = (latest.collagen + latest.texture + latest.luminosity) / 3;
  const previousAvg = (previous.collagen + previous.texture + previous.luminosity) / 3;
  const delta = Math.round(latestAvg - previousAvg);
  if (delta === 0) return 'No change';
  return `${delta > 0 ? '+' : ''}${delta}%`;
}
