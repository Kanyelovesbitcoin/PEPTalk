import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { compounds } from '@/lib/data/compounds';
import { buildStackResult } from '@/lib/utils/stackLogic';
import { storage } from '@/lib/utils/storage';
import { parseJsonArray, parseJsonValue, setJsonItem } from '@/lib/utils/storageJson';
import type { QuizAnswers, StackResult } from '@/types/quiz';

type QuizDraft = Partial<QuizAnswers>;

interface QuizContextValue {
  isReady: boolean;
  quizAnswers: QuizDraft;
  savedStacks: StackResult[];
  currentResult: StackResult | null;
  updateAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  resetQuiz: () => void;
  generateResult: (answersOverride?: QuizAnswers) => StackResult | null;
  saveStack: (result?: StackResult) => void;
  getSavedStack: (stackId: string) => StackResult | undefined;
  isComplete: boolean;
}

const QuizContext = createContext<QuizContextValue | null>(null);

const requiredKeys: Array<keyof QuizAnswers> = [
  'primaryGoal',
  'ageRange',
  'experienceLevel',
  'concerns',
  'injectionComfort',
  'budget',
  'supplementHistory',
  'skinTexture',
  'skinSensitivity',
  'resultPreference',
];

function hasCompleteAnswers(answers: QuizDraft): answers is QuizAnswers {
  return requiredKeys.every((key) => {
    const value = answers[key];
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  });
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const [quizAnswers, setQuizAnswers] = useState<QuizDraft>({});
  const [savedStacks, setSavedStacks] = useState<StackResult[]>([]);
  const [currentResult, setCurrentResult] = useState<StackResult | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadQuizState() {
      try {
        const [storedDraft, storedStacks] = await Promise.all([
          storage.getItem(STORAGE_KEYS.quizDraft),
          storage.getItem(STORAGE_KEYS.savedStacks),
        ]);

        setQuizAnswers(parseJsonValue<QuizDraft>(storedDraft, {}, STORAGE_KEYS.quizDraft));
        setSavedStacks(parseJsonArray<StackResult>(storedStacks, STORAGE_KEYS.savedStacks));
      } finally {
        setIsReady(true);
      }
    }

    loadQuizState();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    setJsonItem(STORAGE_KEYS.quizDraft, quizAnswers);
  }, [isReady, quizAnswers]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    setJsonItem(STORAGE_KEYS.savedStacks, savedStacks);
  }, [isReady, savedStacks]);

  const updateAnswer = useCallback(<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    setQuizAnswers((current) => ({ ...current, [key]: value }));
  }, []);

  const resetQuiz = useCallback(() => {
    setQuizAnswers({});
    setCurrentResult(null);
  }, []);

  const generateResult = useCallback((answersOverride?: QuizAnswers) => {
    const answerSource = answersOverride ?? quizAnswers;

    if (!hasCompleteAnswers(answerSource)) {
      return null;
    }

    const result = buildStackResult(answerSource, compounds);
    setCurrentResult(result);
    return result;
  }, [quizAnswers]);

  const saveStack = useCallback((result?: StackResult) => {
    const stackToSave = result ?? currentResult;
    if (!stackToSave) {
      return;
    }

    setSavedStacks((current) => {
      if (current.some((stack) => stack.id === stackToSave.id)) {
        return current;
      }

      return [stackToSave, ...current];
    });
  }, [currentResult]);

  const getSavedStack = useCallback(
    (stackId: string) => savedStacks.find((stack) => stack.id === stackId),
    [savedStacks],
  );

  const isComplete = useMemo(() => hasCompleteAnswers(quizAnswers), [quizAnswers]);

  const value: QuizContextValue = useMemo(() => ({
    isReady,
    quizAnswers,
    savedStacks,
    currentResult,
    updateAnswer,
    resetQuiz,
    generateResult,
    saveStack,
    getSavedStack,
    isComplete,
  }), [
    currentResult,
    generateResult,
    getSavedStack,
    isComplete,
    isReady,
    quizAnswers,
    resetQuiz,
    saveStack,
    savedStacks,
    updateAnswer,
  ]);

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const context = useContext(QuizContext);

  if (!context) {
    throw new Error('useQuiz must be used inside QuizProvider');
  }

  return context;
}
