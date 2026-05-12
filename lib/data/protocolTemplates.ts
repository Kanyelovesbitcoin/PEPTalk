import type { GoalTag } from '@/types/compound';
import type { DoseUnit, ScheduleFrequency } from '@/types/tracker';

export interface ProtocolTemplate {
  id: string;
  goal: GoalTag;
  title: string;
  compoundId: string;
  frequency: ScheduleFrequency;
  customDays?: number[];
  timeOfDay: string;
  starterAmount: number;
  unit: DoseUnit;
  site: string;
  note: string;
}

export const protocolTemplates: ProtocolTemplate[] = [
  {
    id: 'recovery-bpc',
    goal: 'recovery',
    title: 'Recovery tracker',
    compoundId: 'bpc-157',
    frequency: 'eod',
    timeOfDay: '09:00',
    starterAmount: 0,
    unit: 'mcg',
    site: 'Not set',
    note: 'Blank tracker only. Enter your own product details after clinician guidance.',
  },
  {
    id: 'vitality-cjc',
    goal: 'vitality',
    title: 'Vitality tracker',
    compoundId: 'cjc-1295',
    frequency: 'custom-days',
    customDays: [1],
    timeOfDay: '21:00',
    starterAmount: 0,
    unit: 'mcg',
    site: 'Not set',
    note: 'Blank tracker only. GH-related peptides require medical supervision.',
  },
  {
    id: 'aesthetic-ghk',
    goal: 'aesthetic',
    title: 'Topical routine tracker',
    compoundId: 'ghk-cu',
    frequency: 'daily',
    timeOfDay: '21:30',
    starterAmount: 0,
    unit: 'application',
    site: 'Topical routine',
    note: 'Blank tracker only. Edit product and amount before use.',
  },
  {
    id: 'sharpness-selank',
    goal: 'sharpness',
    title: 'Focus tracker',
    compoundId: 'selank',
    frequency: 'daily',
    timeOfDay: '08:00',
    starterAmount: 0,
    unit: 'spray',
    site: 'Not set',
    note: 'Blank tracker only. Add timing only after clinician guidance.',
  },
  {
    id: 'sleep-epitalon',
    goal: 'sleep',
    title: 'Sleep tracker',
    compoundId: 'epitalon',
    frequency: 'custom-days',
    customDays: [1, 2, 3, 4, 5],
    timeOfDay: '20:00',
    starterAmount: 0,
    unit: 'mcg',
    site: 'Not set',
    note: 'Blank tracker only. Advanced item; confirm details with a clinician.',
  },
];
