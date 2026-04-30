import type { GoalTag } from '@/types/compound';

export type AgeRange = '18-25' | '26-35' | '36-45' | '46-55' | '55+';
export type ExperienceLevel = 'never' | 'some' | 'experienced' | 'deep';
export type InjectionComfort = 'fine' | 'prefer-other' | 'no-way';
export type BudgetPreference = 'under-50' | '50-100' | '100-200' | 'unlimited';
export type QuizConcern =
  | 'dryness'
  | 'uneven-texture'
  | 'redness'
  | 'fine-lines'
  | 'dullness'
  | 'sensitivity';
export type SupplementHistory = 'none' | 'basic-vitamins' | 'some-actives' | 'already-peptides';
export type SkinTexture = 'smooth' | 'some-unevenness' | 'rough' | 'bumpy';
export type SkinSensitivity = 'tolerant' | 'mild-reaction' | 'often-irritated' | 'highly-reactive';
export type ResultPreference = 'quick-wins' | 'long-term' | 'recovery-specific' | 'general-wellness';

export interface QuizAnswers {
  primaryGoal: GoalTag;
  ageRange: AgeRange;
  experienceLevel: ExperienceLevel;
  concerns: QuizConcern[];
  injectionComfort: InjectionComfort;
  budget: BudgetPreference;
  supplementHistory: SupplementHistory;
  skinTexture: SkinTexture;
  skinSensitivity: SkinSensitivity;
  resultPreference: ResultPreference;
}

export interface StackMatch {
  compoundId: string;
  tier: 'primary' | 'secondary' | 'supporting';
  reasoning: string;
}

export interface CompoundInsight {
  compoundId: string;
  personalReasoning: string;
  benefits: string[];
  synergyNote: string;
}

export interface StackResult {
  id: string;
  createdAt: string;
  quizAnswers: QuizAnswers;
  compounds: StackMatch[];
  aiInsights?: CompoundInsight[];
}
