import type { GlowPepRecordExportV2 } from '@/types/export';
import type { QuizAnswers, StackResult } from '@/types/quiz';
import type { DailyCheckIn, DoseLog, DoseSchedule, VialRecipe } from '@/types/tracker';

interface BuildGlowPepRecordInput {
  checkIns: DailyCheckIn[];
  doseLogs: DoseLog[];
  profileName?: string;
  quizAnswers?: Partial<QuizAnswers>;
  savedStacks: StackResult[];
  schedules: DoseSchedule[];
  vialRecipes: VialRecipe[];
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildGlowPepRecordExport(input: BuildGlowPepRecordInput): GlowPepRecordExportV2 {
  return {
    exportedAt: new Date().toISOString(),
    notes: [
      'GlowPep is private education and tracking only, not diagnosis, treatment, prescribing, product guidance, dosing guidance, or medical advice.',
      'All routine amounts, routes, and schedules in this export were entered by the user.',
    ],
    product: 'GlowPep',
    profile: {
      name: input.profileName?.trim() || undefined,
      quizAnswers: input.quizAnswers,
    },
    savedStacks: input.savedStacks,
    schemaVersion: 2,
    tracker: {
      checkIns: input.checkIns,
      doseLogs: input.doseLogs,
      schedules: input.schedules,
      vialRecipes: input.vialRecipes,
    },
  };
}

export function buildDoseLogCsv(doseLogs: DoseLog[]) {
  const header = ['compoundId', 'scheduledAt', 'takenAt', 'amount', 'unit', 'status', 'route', 'injectionSite', 'notes'];
  const rows = doseLogs.map((log) =>
    [
      log.compoundId,
      log.scheduledAt,
      log.takenAt ?? '',
      log.amount,
      log.unit,
      log.status,
      log.administrationRoute ?? '',
      log.injectionSite ?? '',
      log.notes ?? '',
    ]
      .map(csvEscape)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function buildCheckInCsv(checkIns: DailyCheckIn[]) {
  const header = ['date', 'hydration', 'texture', 'glow', 'sensitivity', 'createdAt', 'updatedAt'];
  const rows = checkIns.map((checkIn) =>
    [
      checkIn.date,
      checkIn.hydration,
      checkIn.texture,
      checkIn.glow,
      checkIn.sensitivity,
      checkIn.createdAt,
      checkIn.updatedAt,
    ]
      .map(csvEscape)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}
