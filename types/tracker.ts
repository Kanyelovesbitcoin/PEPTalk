import type { AdministrationRoute } from '@/types/compound';

export type MeasuredDoseUnit = 'mcg' | 'mg' | 'iu';

export type RoutineDoseUnit =
  | MeasuredDoseUnit
  | 'pump'
  | 'drop'
  | 'spray'
  | 'capsule'
  | 'application';

export type DoseUnit = RoutineDoseUnit;

export type DoseStatus = 'planned' | 'taken' | 'skipped';

export type ScheduleFrequency = 'daily' | 'eod' | 'custom-days';

export type SyringeType = 'u100';

export interface DoseLog {
  id: string;
  compoundId: string;
  scheduleId?: string;
  vialRecipeId?: string;
  scheduledAt: string;
  takenAt?: string;
  amount: number;
  unit: DoseUnit;
  administrationRoute?: AdministrationRoute | string;
  injectionSite?: string;
  status: DoseStatus;
  skinFeel?: number;
  sideEffects?: string[];
  notes?: string;
  feedback?: 'nothing' | 'better' | 'too-strong' | 'side-effects' | 'unsure';
  createdAt: string;
  updatedAt: string;
}

export interface VialRecipe {
  id: string;
  compoundId: string;
  vialAmount: number;
  vialUnit: MeasuredDoseUnit;
  bacWaterMl: number;
  targetDose: number;
  targetDoseUnit: MeasuredDoseUnit;
  outputMl: number;
  outputUnits: number;
  concentrationPerMl: number;
  syringeType: SyringeType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoseSchedule {
  id: string;
  compoundId: string;
  vialRecipeId?: string;
  amount: number;
  unit: DoseUnit;
  frequency: ScheduleFrequency;
  customDays?: number[];
  timeOfDay: string;
  timeLabel?: string;
  startDate: string;
  endDate?: string;
  remindersEnabled: boolean;
  administrationRoute?: AdministrationRoute | string;
  injectionSite?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledDosePreview {
  schedule: DoseSchedule;
  scheduledAt: string;
}

export interface DailyCheckIn {
  id: string;
  date: string;
  hydration: number;
  texture: number;
  glow: number;
  sensitivity: number;
  createdAt: string;
  updatedAt: string;
}
