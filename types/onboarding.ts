export type OnboardingStepId =
  | 'welcome'
  | 'goal'
  | 'experience'
  | 'timing'
  | 'rotation'
  | 'reminders'
  | 'progress'
  | 'summary';

export type OnboardingPrimaryGoal =
  | 'skin-glow'
  | 'recovery'
  | 'energy-focus'
  | 'sleep-support'
  | 'fitness-support'
  | 'general-wellness'
  | 'routine-tracking';

export type OnboardingExperienceLevel = 'new' | 'researching' | 'has-routine' | 'advanced';

export type OnboardingRoutineTiming = 'morning' | 'afternoon' | 'evening' | 'multiple' | 'custom';

export type OnboardingRotationPreference = 'yes' | 'maybe-later' | 'no-reminders-only';

export type OnboardingReminderPreference = 'daily' | 'routine-based' | 'weekly-check-ins' | 'not-now';

export type OnboardingProgressMetric =
  | 'routine-consistency'
  | 'skin-notes'
  | 'recovery-notes'
  | 'sleep-notes'
  | 'energy-focus-notes'
  | 'journal-notes';

export interface OnboardingPreferences {
  schemaVersion: 1;
  completedAt: string;
  primaryGoal: OnboardingPrimaryGoal;
  experienceLevel: OnboardingExperienceLevel;
  routineTiming: OnboardingRoutineTiming;
  wantsRotationTracking: OnboardingRotationPreference;
  reminderPreference: OnboardingReminderPreference;
  progressMetrics: OnboardingProgressMetric[];
}
