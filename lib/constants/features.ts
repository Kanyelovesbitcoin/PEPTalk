export const FREE_LIMITS = {
  aiStackPreviews: 1,
  savedStacks: 1,
} as const;

export type FeatureKey =
  | 'aiStackMatching'
  | 'compoundDeepDive'
  | 'dataExport'
  | 'libraryAccess'
  | 'multipleSavedStacks'
  | 'privateReminders'
  | 'privacyControls'
  | 'trustAndSafety';

export interface FeatureAccess {
  allowed: boolean;
  cta: string;
  description: string;
  key: FeatureKey;
  title: string;
}

const FEATURE_COPY: Record<FeatureKey, Omit<FeatureAccess, 'allowed' | 'key'>> = {
  aiStackMatching: {
    cta: 'Start trial',
    description: 'Trial unlocks the deep Glowmax guide, educational matching, and regenerated context.',
    title: 'Deep Glowmax guide',
  },
  compoundDeepDive: {
    cta: 'Unlock full notes',
    description: 'Pro adds deeper compound notes, tracking context, and long-form educational reasoning.',
    title: 'Full compound depth',
  },
  dataExport: {
    cta: 'Unlock Your Record',
    description: 'Pro exports your saved items, amount logs, check-ins, schedules, recipes, and saved AI context.',
    title: 'Your Record export',
  },
  libraryAccess: {
    cta: 'Open library',
    description: 'The peptide library, legal labels, and safety context stay available to everyone.',
    title: 'Library browsing',
  },
  multipleSavedStacks: {
    cta: 'Save more items',
    description: 'Free keeps local Library and tracker use open. Pro saves multiple Glowmax saved lists for different goals.',
    title: 'Multiple saved lists',
  },
  privateReminders: {
    cta: 'Unlock private reminders',
    description: 'Pro adds discreet routine reminders with no compound name or amount on the lock screen.',
    title: 'Private reminders',
  },
  privacyControls: {
    cta: 'Review privacy',
    description: 'Privacy notices, cosmetic disclaimers, and local-data controls are never paywalled.',
    title: 'Privacy controls',
  },
  trustAndSafety: {
    cta: 'View safety context',
    description: 'Legal status, research labels, and cosmetic-only framing stay visible for every user.',
    title: 'Trust and safety',
  },
};

const FREE_FEATURES: ReadonlySet<FeatureKey> = new Set([
  'libraryAccess',
  'privacyControls',
  'trustAndSafety',
]);

export function getFeatureAccess(key: FeatureKey, isPro: boolean): FeatureAccess {
  return {
    ...FEATURE_COPY[key],
    allowed: isPro || FREE_FEATURES.has(key),
    key,
  };
}
