import { goalById } from '@/lib/constants/goals';
import type { Compound, Difficulty, GoalTag } from '@/types/compound';
import type {
  BudgetPreference,
  ExperienceLevel,
  QuizAnswers,
  QuizConcern,
  StackResult,
} from '@/types/quiz';

const relatedGoalFallbacks: Record<GoalTag, GoalTag[]> = {
  recovery: ['vitality', 'sleep'],
  energy: ['sharpness', 'vitality'],
  sharpness: ['energy', 'sleep'],
  vitality: ['recovery', 'aesthetic'],
  aesthetic: ['vitality', 'recovery'],
  sleep: ['recovery', 'vitality'],
};

const concernBoosts: Record<QuizConcern, GoalTag[]> = {
  dryness: ['aesthetic', 'vitality'],
  'uneven-texture': ['aesthetic', 'recovery'],
  redness: ['recovery', 'vitality'],
  'fine-lines': ['aesthetic', 'vitality'],
  dullness: ['energy', 'aesthetic'],
  sensitivity: ['recovery', 'sleep'],
};

const concernLabels: Record<QuizConcern, string> = {
  dryness: 'low resilience',
  'uneven-texture': 'aesthetic upkeep',
  redness: 'inflammation',
  'fine-lines': 'visible aging',
  dullness: 'flat energy',
  sensitivity: 'slow recovery',
};

const budgetOrder: Record<BudgetPreference, Compound['budgetTier'][]> = {
  'under-50': ['low'],
  '50-100': ['low', 'mid'],
  '100-200': ['low', 'mid', 'high'],
  unlimited: ['low', 'mid', 'high'],
};

const difficultyOrder: Record<ExperienceLevel, Difficulty[]> = {
  never: ['beginner'],
  some: ['beginner', 'intermediate'],
  experienced: ['beginner', 'intermediate', 'advanced'],
  deep: ['beginner', 'intermediate', 'advanced'],
};

function scoreCompound(compound: Compound, answers: QuizAnswers): number {
  let score = 0;

  if (compound.goals.includes(answers.primaryGoal)) {
    score += 120;
  } else if (relatedGoalFallbacks[answers.primaryGoal].some((goal) => compound.goals.includes(goal))) {
    score += 35;
  }

  if (answers.injectionComfort === 'prefer-other' && !compound.administrationRoutes.includes('injection')) {
    score += 14;
  }

  if (answers.budget === 'under-50' && compound.budgetTier === 'low') {
    score += 12;
  }

  if (answers.experienceLevel === 'never' && compound.difficulty === 'beginner') {
    score += 10;
  }

  if (answers.experienceLevel === 'some' && compound.difficulty !== 'advanced') {
    score += 8;
  }

  answers.concerns.forEach((concern) => {
    concernBoosts[concern].forEach((goal) => {
      if (compound.goals.includes(goal)) score += 16;
    });
  });

  if (answers.skinTexture === 'rough' || answers.skinTexture === 'bumpy') {
    if (compound.goals.includes('aesthetic')) score += 20;
    if (compound.goals.includes('recovery')) score += 12;
  }

  if (answers.skinSensitivity === 'often-irritated' || answers.skinSensitivity === 'highly-reactive') {
    if (compound.goals.includes('recovery')) score += 22;
    if (compound.goals.includes('sleep')) score += 10;
  }

  if (answers.supplementHistory === 'already-peptides' && compound.difficulty === 'advanced') {
    score += 10;
  }

  if (answers.resultPreference === 'quick-wins' && compound.researchStatus === 'well-studied') {
    score += 10;
  }

  if (answers.resultPreference === 'long-term' && compound.goals.includes('vitality')) {
    score += 10;
  }

  if (answers.resultPreference === 'recovery-specific' && compound.goals.includes('recovery')) {
    score += 12;
  }

  return score;
}

function applyFilters(compoundList: Compound[], answers: QuizAnswers, strictGoalOnly: boolean): Compound[] {
  const allowedBudgets = budgetOrder[answers.budget];
  const baseDifficulties = difficultyOrder[answers.experienceLevel];
  const allowedDifficulties =
    answers.supplementHistory === 'already-peptides' && !baseDifficulties.includes('advanced')
      ? [...baseDifficulties, 'advanced' as Difficulty]
      : baseDifficulties;

  return compoundList.filter((compound) => {
    const goalMatch = strictGoalOnly
      ? compound.goals.includes(answers.primaryGoal)
      : compound.goals.includes(answers.primaryGoal) ||
        relatedGoalFallbacks[answers.primaryGoal].some((goal) => compound.goals.includes(goal));

    if (!goalMatch) return false;
    if (answers.injectionComfort === 'no-way' && compound.administrationRoutes.every((route) => route === 'injection')) {
      return false;
    }
    if (!allowedBudgets.includes(compound.budgetTier)) return false;
    if (!allowedDifficulties.includes(compound.difficulty)) return false;
    return true;
  });
}

function sortCompounds(pool: Compound[], answers: QuizAnswers): Compound[] {
  return [...pool].sort((left, right) => {
    const scoreDelta = scoreCompound(right, answers) - scoreCompound(left, answers);
    return scoreDelta !== 0 ? scoreDelta : left.name.localeCompare(right.name);
  });
}

function ensureEnoughMatches(compoundList: Compound[], answers: QuizAnswers): Compound[] {
  const strict = sortCompounds(applyFilters(compoundList, answers, true), answers);
  if (strict.length >= 3) return strict;

  const relaxedGoal = sortCompounds(applyFilters(compoundList, answers, false), answers);
  if (relaxedGoal.length >= 3) return relaxedGoal;

  return sortCompounds(
    compoundList.filter((compound) => {
      if (answers.injectionComfort === 'no-way' && compound.administrationRoutes.every((route) => route === 'injection')) {
        return false;
      }
      return compound.goals.includes(answers.primaryGoal);
    }),
    answers,
  );
}

function buildReasoning(compound: Compound, answers: QuizAnswers, index: number): string {
  const goalTitle = goalById[answers.primaryGoal].shortTitle.toLowerCase();
  const matchingConcern = answers.concerns.find((concern) =>
    concernBoosts[concern].some((goal) => compound.goals.includes(goal)),
  );

  const sentences: string[] = [];
  if (index === 0) {
    sentences.push(`You picked ${goalTitle}. ${compound.name} maps directly to it.`);
  } else if (index === 1) {
    sentences.push(`${compound.name} backstops the primary with a complementary angle.`);
  } else {
    sentences.push(`${compound.name} rounds out the stack as support, not the headline.`);
  }

  if (matchingConcern) {
    sentences.push(`It also fits the ${concernLabels[matchingConcern]} concern you called out.`);
  }
  if (answers.injectionComfort !== 'fine' && !compound.administrationRoutes.includes('injection')) {
    sentences.push('It stays on the easier side because it does not force an injection-only route.');
  }
  if (answers.experienceLevel === 'never' && compound.difficulty === 'beginner') {
    sentences.push('It is beginner-friendly, which keeps the stack more realistic as a first step.');
  }
  return sentences.join(' ');
}

export function getMatchedCompounds(compoundList: Compound[], answers: QuizAnswers): Compound[] {
  return ensureEnoughMatches(compoundList, answers).slice(0, 5);
}

export function buildStackResult(answers: QuizAnswers, compoundList: Compound[]): StackResult {
  const matches = getMatchedCompounds(compoundList, answers);
  return {
    id: `${answers.primaryGoal}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    quizAnswers: answers,
    compounds: matches.map((compound, index) => ({
      compoundId: compound.id,
      tier: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'supporting',
      reasoning: buildReasoning(compound, answers, index),
    })),
  };
}
