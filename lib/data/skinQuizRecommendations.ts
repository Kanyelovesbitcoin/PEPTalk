import { compounds } from '@/lib/data/compounds';
import type { Compound } from '@/types/compound';

export type SkinPrimaryConcern =
  | 'acne'
  | 'redness'
  | 'dullness'
  | 'aging'
  | 'oiliness'
  | 'dryness';
export type SkinSunExposure = 'low' | 'medium' | 'high';
export type SkinType = 'oily' | 'dry' | 'combo' | 'normal';
export type SkinActive = 'retinoid' | 'vitamin-c' | 'niacinamide' | 'none';

export interface SkinQuizAnswers {
  activeBreakouts: 'yes' | 'no';
  currentActives: SkinActive[];
  primaryConcern: SkinPrimaryConcern;
  rednessSensitivity: 'yes' | 'no';
  skinType: SkinType;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  sunExposure: SkinSunExposure;
}

export interface SkinQuizRecommendation {
  compoundId: string;
  rationale: string;
}

const cosmeticCompounds = compounds.filter((compound) => compound.legalStatus === 'cosmetic');
const cosmeticById = cosmeticCompounds.reduce<Record<string, Compound>>((lookup, compound) => {
  lookup[compound.id] = compound;
  return lookup;
}, {});

export function getSkinQuizRecommendations(
  answers: SkinQuizAnswers,
): SkinQuizRecommendation[] {
  const recommendationMap = new Map<string, SkinQuizRecommendation>();

  function push(compoundId: string, rationale: string) {
    if (!cosmeticById[compoundId]) return;
    if (!recommendationMap.has(compoundId)) {
      recommendationMap.set(compoundId, { compoundId, rationale });
    }
  }

  if (
    answers.primaryConcern === 'aging'
    || answers.primaryConcern === 'dullness'
    || answers.sunExposure === 'high'
    || answers.stressLevel >= 4
  ) {
    push(
      'matrixyl',
      'Matrixyl is surfaced for skin-appearance support when stress, sun load, or age-related concerns are highest.',
    );
  }

  if (
    answers.primaryConcern === 'redness'
    || answers.primaryConcern === 'dryness'
    || answers.rednessSensitivity === 'yes'
    || answers.skinType === 'dry'
  ) {
    push(
      'ghk-cu',
      'GHK-Cu is surfaced for a barrier-leaning cosmetic profile when redness, sensitivity, or dryness dominates.',
    );
  }

  if (
    answers.primaryConcern === 'acne'
    || answers.primaryConcern === 'oiliness'
    || answers.activeBreakouts === 'yes'
    || answers.skinType === 'oily'
  ) {
    push(
      'ghk-cu',
      'GHK-Cu is surfaced for acne/oiliness contexts because users often prioritize calmer-looking skin support.',
    );
  }

  if (recommendationMap.size === 0) {
    push('ghk-cu', 'Baseline cosmetic option for broad skin-appearance support.');
    push('matrixyl', 'Baseline cosmetic option for texture and visible-aging context.');
  }

  return Array.from(recommendationMap.values());
}

export function getCosmeticCompoundById(compoundId: string): Compound | null {
  return cosmeticById[compoundId] ?? null;
}
