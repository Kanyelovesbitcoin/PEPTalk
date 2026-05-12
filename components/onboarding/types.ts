import type { GoalTag } from '@/types/compound';

export type OnboardingExperience = 'new' | 'some' | 'regular';
export type OnboardingHorizon = '4w' | '8w' | '12w' | 'long';

export interface OnboardingAnswers {
  age?: number;
  consistency?: number;
  currentStack?: string[];
  experience?: OnboardingExperience;
  frustration?: string;
  guidelinesAccepted?: string[];
  horizon?: OnboardingHorizon;
  name?: string;
  noCurrentStack?: boolean;
  notifications?: boolean;
  primaryGoal?: GoalTag;
  satisfaction?: number;
}

export type OnboardingAnswerField = keyof OnboardingAnswers;

export interface OnboardingOption {
  description?: string;
  exclusive?: boolean;
  id: string;
  label: string;
}

export interface HeroPoint {
  body: string;
  icon?: string;
  label: string;
}

export interface HeroStat {
  body: string;
  label: string;
  value: string;
}

export type HeroArt =
  | 'boundary'
  | 'credibility'
  | 'dossier'
  | 'problem'
  | 'proof'
  | 'promise'
  | 'welcome'
  | 'workflow';

export interface InputFieldSpec {
  field: Extract<OnboardingAnswerField, 'age' | 'name'>;
  helper?: string;
  keyboardType?: 'default' | 'number-pad';
  label: string;
  placeholder: string;
  required?: boolean;
}

export interface GuidelineSpec {
  id: string;
  label: string;
  required?: boolean;
}

export interface SummaryRowSpec {
  fallback?: string;
  field?: OnboardingAnswerField;
  label: string;
  value?: string;
  valueTemplate?: string;
}

export type SlideConfig =
  | {
      art?: HeroArt;
      body: string;
      cta?: string;
      eyebrow: string;
      id: string;
      kind: 'hero';
      points?: HeroPoint[];
      stat?: HeroStat;
      title: string;
    }
  | {
      cta?: string;
      eyebrow: string;
      guidelines: GuidelineSpec[];
      id: string;
      kind: 'guidelines';
      subtitle?: string;
      title: string;
    }
  | {
      cta?: string;
      eyebrow: string;
      field: OnboardingAnswerField;
      id: string;
      kind: 'picker';
      options: OnboardingOption[];
      required?: boolean;
      subtitle: string;
      title: string;
    }
  | {
      cta?: string;
      eyebrow: string;
      field: OnboardingAnswerField;
      id: string;
      kind: 'multi';
      max?: number;
      options: OnboardingOption[];
      required?: boolean;
      subtitle: string;
      title: string;
    }
  | {
      cta?: string;
      eyebrow: string;
      field: Extract<OnboardingAnswerField, 'consistency' | 'satisfaction'>;
      highLabel: string;
      id: string;
      kind: 'slider';
      lowLabel: string;
      required?: boolean;
      subtitle?: string;
      title: string;
    }
  | {
      body: string;
      cta?: string;
      eyebrow: string;
      field?: Extract<OnboardingAnswerField, 'notifications'>;
      id: string;
      kind: 'toggle';
      primaryLabel: string;
      required?: boolean;
      secondaryLabel?: string;
      title: string;
    }
  | {
      cta?: string;
      eyebrow: string;
      fields: InputFieldSpec[];
      id: string;
      kind: 'input';
      subtitle?: string;
      title: string;
    }
  | {
      durationMs: number;
      eyebrow: string;
      id: string;
      kind: 'loader';
      taglines: string[];
      title: string;
    }
  | {
      cta: string;
      eyebrow: string;
      id: string;
      kind: 'reveal';
      summaryRows: SummaryRowSpec[];
      titleTemplate: string;
    };
