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
    title: 'Recovery scaffold',
    compoundId: 'bpc-157',
    frequency: 'eod',
    timeOfDay: '09:00',
    starterAmount: 1,
    unit: 'mcg',
    site: 'Abdomen',
    note: 'Scaffold only. Confirm dosing and product with a qualified clinician.',
  },
  {
    id: 'vitality-cjc',
    goal: 'vitality',
    title: 'Vitality weekly anchor',
    compoundId: 'cjc-1295',
    frequency: 'custom-days',
    customDays: [1],
    timeOfDay: '21:00',
    starterAmount: 1,
    unit: 'mcg',
    site: 'Abdomen',
    note: 'Scaffold only. GH peptides require medical supervision.',
  },
  {
    id: 'aesthetic-ghk',
    goal: 'aesthetic',
    title: 'Aesthetic topical log',
    compoundId: 'ghk-cu',
    frequency: 'daily',
    timeOfDay: '21:30',
    starterAmount: 1,
    unit: 'mcg',
    site: 'Topical routine',
    note: 'Scaffold only. Edit product and amount before use.',
  },
  {
    id: 'sharpness-selank',
    goal: 'sharpness',
    title: 'Sharpness focus scaffold',
    compoundId: 'selank',
    frequency: 'daily',
    timeOfDay: '08:00',
    starterAmount: 1,
    unit: 'mcg',
    site: 'Nasal',
    note: 'Scaffold only. Cycle, do not chronic-dose.',
  },
  {
    id: 'sleep-epitalon',
    goal: 'sleep',
    title: 'Sleep cycle scaffold',
    compoundId: 'epitalon',
    frequency: 'custom-days',
    customDays: [1, 2, 3, 4, 5],
    timeOfDay: '20:00',
    starterAmount: 1,
    unit: 'mcg',
    site: 'Evening routine',
    note: 'Scaffold only. Advanced — confirm dosing with a clinician.',
  },
];
