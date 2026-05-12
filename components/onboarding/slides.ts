import { frustrations } from '@/lib/constants/frustrations';
import { goals } from '@/lib/constants/goals';
import { compounds } from '@/lib/data/compounds';

import type { OnboardingOption, SlideConfig } from './types';

const goalOptions: OnboardingOption[] = goals.map((goal) => ({
  description: goal.description,
  id: goal.id,
  label: goal.title,
}));

const currentStackOptions: OnboardingOption[] = [
  {
    description: 'Start with a blank dossier and add trackers later.',
    exclusive: true,
    id: 'nothing-yet',
    label: 'Nothing yet',
  },
  ...compounds.map((compound) => ({
    description: compound.nickname,
    id: compound.id,
    label: compound.name,
  })),
];

const frustrationOptions: OnboardingOption[] = frustrations.map((frustration) => ({
  description: frustration.description,
  id: frustration.id,
  label: frustration.label,
}));

export const SLIDES: SlideConfig[] = [
  {
    art: 'welcome',
    body: 'A private research workspace for peptide notes, routine signals, and the questions you want to answer with less noise.',
    cta: 'Begin',
    eyebrow: 'WELCOME',
    id: 'welcome',
    kind: 'hero',
    title: 'Turn a messy peptide trail into a clear file.',
  },
  {
    cta: 'Set focus',
    eyebrow: 'PRIMARY GOAL',
    field: 'primaryGoal',
    id: 'primary-goal',
    kind: 'picker',
    options: goalOptions,
    required: true,
    subtitle: 'Choose the research lane you want closest at hand first. You can study other lanes later.',
    title: 'What should this dossier pay attention to?',
  },
  {
    eyebrow: 'EXPERIENCE',
    field: 'experience',
    id: 'experience',
    kind: 'picker',
    options: [
      {
        description: 'Keep language plain, context conservative, and the workflow low-friction.',
        id: 'new',
        label: 'First time',
      },
      {
        description: 'You have read around the space and want a cleaner way to compare notes.',
        id: 'some',
        label: 'I have experimented',
      },
      {
        description: 'You already track routines and want stronger organization around them.',
        id: 'regular',
        label: 'Regular tracker',
      },
    ],
    required: true,
    subtitle: 'This helps tune how much context the app brings forward.',
    title: 'How familiar are you with peptide research?',
  },
  {
    cta: 'Save stack',
    eyebrow: 'CURRENT STACK',
    field: 'currentStack',
    id: 'current-stack',
    kind: 'multi',
    options: currentStackOptions,
    required: true,
    subtitle: 'Select what is already in your notes, or start clean. This is for organization only.',
    title: 'What are you tracking or researching now?',
  },
  {
    eyebrow: 'FRICTION POINT',
    field: 'frustration',
    id: 'frustration',
    kind: 'picker',
    options: frustrationOptions,
    required: true,
    subtitle: 'A good workspace should remove one specific kind of drag first.',
    title: 'What makes this feel harder than it should?',
  },
  {
    eyebrow: 'TIME HORIZON',
    field: 'horizon',
    id: 'horizon',
    kind: 'picker',
    options: [
      { description: 'A short read on consistency and first signals.', id: '4w', label: '4 weeks' },
      { description: 'Enough time to notice routine patterns without over-reading noise.', id: '8w', label: '8 weeks' },
      { description: 'A steadier view across a full quarter of notes.', id: '12w', label: '12 weeks' },
      { description: 'Long-horizon research and personal tracking.', id: 'long', label: 'Longer' },
    ],
    required: true,
    subtitle: 'This gives your notes a review cadence instead of an endless open tab.',
    title: 'What timeline are you trying to understand?',
  },
  {
    cta: 'Acknowledge',
    eyebrow: 'WORKSPACE GUIDELINES',
    guidelines: [
      {
        id: 'research-tracking',
        label: 'I understand GlowPep is for research organization and personal tracking only.',
        required: true,
      },
      {
        id: 'no-medical-advice',
        label: 'I understand GlowPep does not prescribe, diagnose, treat, or provide medical advice.',
        required: true,
      },
      {
        id: 'professional-context',
        label: 'I understand peptide decisions should be discussed with a qualified professional.',
        required: true,
      },
    ],
    id: 'workspace-guidelines',
    kind: 'guidelines',
    subtitle: 'A clear file starts with clear boundaries. These keep the workspace calm, private, and research-focused.',
    title: 'Set the rules of the workspace.',
  },
  {
    cta: 'Set baseline',
    eyebrow: 'BASELINE',
    field: 'consistency',
    highLabel: 'Very consistent',
    id: 'consistency',
    kind: 'slider',
    lowLabel: 'All over the place',
    required: true,
    subtitle: 'No judgment. This gives your future check-ins a starting line.',
    title: 'How consistent does your routine feel today?',
  },
  {
    cta: 'Add signal',
    eyebrow: 'SATISFACTION',
    field: 'satisfaction',
    highLabel: 'Highly satisfied',
    id: 'satisfaction',
    kind: 'slider',
    lowLabel: 'Not satisfied',
    required: true,
    subtitle: 'Use your own read. This is a private signal, not a medical score.',
    title: 'How satisfied are you with skin, recovery, or daily feel right now?',
  },
  {
    body: 'Helpful reminders can support consistency, but the app works without them. Choose what fits your attention span.',
    cta: 'Continue',
    eyebrow: 'REMINDERS',
    field: 'notifications',
    id: 'notifications',
    kind: 'toggle',
    primaryLabel: 'Allow reminders',
    required: true,
    secondaryLabel: 'Not now',
    title: 'Should GlowPep nudge your routine reviews?',
  },
  {
    cta: 'Personalize file',
    eyebrow: 'PROFILE',
    fields: [
      {
        field: 'name',
        helper: 'Optional. Used for greetings and snapshot copy.',
        keyboardType: 'default',
        label: 'Name',
        placeholder: 'First name',
      },
      {
        field: 'age',
        helper: 'Required. GlowPep is restricted to users 18 and older.',
        keyboardType: 'number-pad',
        label: 'Age',
        placeholder: 'Age',
        required: true,
      },
    ],
    id: 'profile',
    kind: 'input',
    subtitle: 'Name is optional. Age is required for research safety.',
    title: 'Add a small label to the file.',
  },
  {
    durationMs: 3200,
    eyebrow: 'BUILDING FILE',
    id: 'loader',
    kind: 'loader',
    taglines: [
      'Building private dossier...',
      'Syncing selected stack...',
      'Preparing research workspace...',
      'Checking trial access...',
    ],
    title: 'Building your dossier.',
  },
  {
    cta: 'View workspace',
    eyebrow: 'SNAPSHOT',
    id: 'snapshot',
    kind: 'reveal',
    summaryRows: [
      {
        label: 'Research lane',
        valueTemplate: '{primaryGoal} with {experience} context',
      },
      {
        fallback: 'No friction point selected',
        field: 'frustration',
        label: 'Main friction',
      },
      {
        label: 'Review horizon',
        valueTemplate: '{horizon}',
      },
      {
        label: 'Baseline',
        valueTemplate: 'Consistency {consistency}; satisfaction {satisfaction}',
      },
      {
        label: 'Stack notes',
        valueTemplate: '{currentStack}',
      },
    ],
    titleTemplate: 'Your {primaryGoal} snapshot is ready.',
  },
  {
    cta: 'Start questionnaire',
    eyebrow: 'WORKSPACE READY',
    id: 'workspace-ready',
    kind: 'reveal',
    summaryRows: [
      {
        label: 'Profile',
        valueTemplate: '{name} - {primaryGoal}',
      },
      {
        label: 'Stack notes',
        valueTemplate: '{currentStack}',
      },
      {
        label: 'Next step',
        value: 'Answer the guide so GlowPep can build your first saved list.',
      },
    ],
    titleTemplate: 'The file is open. Now we build the first saved list.',
  },
];
