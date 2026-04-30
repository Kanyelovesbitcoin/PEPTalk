import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';

export interface SkinScan {
  id: string;
  takenAt: string;
  photoUri?: string;
  frontUri?: string;
  leftUri?: string;
  rightUri?: string;
  angleInsights?: {
    front: string;
    left: string;
    right: string;
  };
  collagen: number;
  texture: number;
  luminosity: number;
  feedbackSummary?: string;
  improvements?: string[];
  recommendedCompoundIds?: string[];
  analysisSource?: 'ai' | 'fallback';
}

function parseScans(value: string | null): SkinScan[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SkinScan[]) : [];
  } catch {
    return [];
  }
}

export async function getSkinScans(): Promise<SkinScan[]> {
  const stored = await storage.getItem(STORAGE_KEYS.skinScans);
  return parseScans(stored).sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export async function getLatestSkinScan(): Promise<SkinScan | null> {
  const scans = await getSkinScans();
  return scans[0] ?? null;
}

export async function saveSkinScan(scan: Omit<SkinScan, 'id' | 'takenAt'>): Promise<SkinScan> {
  const nextScan: SkinScan = {
    ...scan,
    id: `skin-scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    takenAt: new Date().toISOString(),
  };
  const scans = await getSkinScans();
  await storage.setItem(STORAGE_KEYS.skinScans, JSON.stringify([nextScan, ...scans]));
  return nextScan;
}
