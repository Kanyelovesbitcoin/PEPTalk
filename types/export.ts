import type { QuizAnswers, StackResult } from '@/types/quiz';
import type { DailyCheckIn, DoseLog, DoseSchedule, VialRecipe } from '@/types/tracker';

export interface GlowPepRecordExportV2 {
  product: 'GlowPep';
  schemaVersion: 2;
  exportedAt: string;
  profile: {
    name?: string;
    quizAnswers?: Partial<QuizAnswers>;
  };
  tracker: {
    checkIns: DailyCheckIn[];
    doseLogs: DoseLog[];
    schedules: DoseSchedule[];
    vialRecipes: VialRecipe[];
  };
  savedStacks: StackResult[];
  notes: string[];
}
