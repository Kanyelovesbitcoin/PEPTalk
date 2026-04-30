export type CompoundType = 'peptide';

export type ResearchStatus = 'well-studied' | 'promising' | 'early-research';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type GoalTag =
  | 'recovery'
  | 'energy'
  | 'sharpness'
  | 'vitality'
  | 'aesthetic'
  | 'sleep';

export type AdministrationRoute = 'oral' | 'sublingual' | 'nasal' | 'injection' | 'topical';

export type BudgetTier = 'low' | 'mid' | 'high';

export type LegalStatus = 'cosmetic' | 'research';

export interface Compound {
  id: string;
  name: string;
  nickname: string;
  type: CompoundType;
  difficulty: Difficulty;
  researchStatus: ResearchStatus;
  goals: GoalTag[];
  administrationRoutes: AdministrationRoute[];
  summary: string;
  whatIsIt: string;
  whatIsItGoodFor: string[];
  howDoesItWork: string;
  thingsToKnow: string[];
  budgetTier: BudgetTier;
  legalStatus: LegalStatus;
}
