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

export type LegalStatus = 'cosmetic' | 'research' | 'approved-rx' | 'investigational';

export type RegulatoryStatus =
  | 'approved-rx'
  | 'cosmetic-topical'
  | 'research-only'
  | 'investigational'
  | 'compounding-concern';

export type RiskBadge =
  | 'FDA-approved Rx'
  | 'Prescription-only'
  | 'Research-only'
  | 'Limited human data'
  | 'FDA compounding concern'
  | 'WADA athlete caution'
  | 'Cosmetic topical'
  | 'Investigational';

export interface EvidenceProfile {
  preclinical: number;
  humanTrials: number;
  anecdotal: number;
  cosmetic: number;
}

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
  regulatoryStatus: RegulatoryStatus;
  riskBadges: RiskBadge[];
  athleteCaution?: string;
  evidenceNote: string;
  trackingDisclaimer: string;
  class?: string;
  origin?: string;
  tags?: string[];
  pullQuote?: string;
  evidence?: EvidenceProfile;
  relatedCompoundIds?: string[];
  evidenceLabel?: 'Promising' | 'Mixed' | 'Limited' | 'Early' | 'Cosmetic';
  breadth?: 1 | 2 | 3;
}
