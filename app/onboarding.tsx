import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { GuidelinesSlide } from '@/components/onboarding/GuidelinesSlide';
import { HeroSlide } from '@/components/onboarding/HeroSlide';
import { InputSlide } from '@/components/onboarding/InputSlide';
import { LoaderSlide } from '@/components/onboarding/LoaderSlide';
import { MultiSelectSlide } from '@/components/onboarding/MultiSelectSlide';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PickerSlide } from '@/components/onboarding/PickerSlide';
import { RevealSlide } from '@/components/onboarding/RevealSlide';
import { SliderSlide } from '@/components/onboarding/SliderSlide';
import { SLIDES } from '@/components/onboarding/slides';
import { ToggleSlide } from '@/components/onboarding/ToggleSlide';
import type { OnboardingAnswerField, OnboardingAnswers, SlideConfig } from '@/components/onboarding/types';
import { TrialAccessState } from '@/components/TrialAccessState';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { compoundById } from '@/lib/data/compounds';
import { usePro } from '@/lib/hooks/usePro';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { hapticSelection, hapticSuccess } from '@/lib/utils/haptics';
import { showPaywallWithTimeout } from '@/lib/utils/paywallTimeout';
import { storage } from '@/lib/utils/storage';
import type { AgeRange, ExperienceLevel } from '@/types/quiz';

type FinishOptions = {
  skipped?: boolean;
};

const INITIAL_ANSWERS: OnboardingAnswers = {
  currentStack: [],
  guidelinesAccepted: [],
  noCurrentStack: false,
};

const experienceToQuizExperience: Record<NonNullable<OnboardingAnswers['experience']>, ExperienceLevel> = {
  new: 'never',
  regular: 'experienced',
  some: 'some',
};

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

function ageToRange(age?: number): AgeRange | null {
  if (!age || age < 18 || age > 120) return null;
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  return '55+';
}

function sanitizeCurrentStack(values?: string[]) {
  const cleanValues = values?.filter((value) => value !== 'nothing-yet' && Boolean(compoundById[value])) ?? [];
  return Array.from(new Set(cleanValues));
}

function cleanAnswers(answers: OnboardingAnswers): OnboardingAnswers {
  const name = answers.name?.trim();
  return {
    ...answers,
    age: typeof answers.age === 'number' && answers.age >= 18 && answers.age <= 120 ? answers.age : undefined,
    currentStack: sanitizeCurrentStack(answers.currentStack),
    guidelinesAccepted: answers.guidelinesAccepted ?? [],
    name: name || undefined,
    noCurrentStack: Boolean(answers.noCurrentStack),
  };
}

function slideIsComplete(slide: SlideConfig, answers: OnboardingAnswers) {
  switch (slide.kind) {
    case 'hero':
    case 'reveal':
      return true;
    case 'loader':
      return false;
    case 'picker':
      return slide.required === false || hasValue(answers[slide.field]);
    case 'multi':
      if (slide.field === 'currentStack') {
        return slide.required === false || Boolean(answers.noCurrentStack) || sanitizeCurrentStack(answers.currentStack).length > 0;
      }
      return slide.required === false || hasValue(answers[slide.field]);
    case 'guidelines': {
      const accepted = answers.guidelinesAccepted ?? [];
      return slide.guidelines.every((guideline) => !guideline.required || accepted.includes(guideline.id));
    }
    case 'slider':
      return slide.required === false || typeof answers[slide.field] === 'number';
    case 'toggle':
      return !slide.field || slide.required === false || typeof answers[slide.field] === 'boolean';
    case 'input': {
      const invalidAge = typeof answers.age === 'number' && (answers.age < 18 || answers.age > 120);
      if (invalidAge) return false;
      return slide.fields.every((field) => {
        if (!field.required) return true;
        return field.field === 'age' ? Boolean(ageToRange(answers.age)) : Boolean(answers.name?.trim());
      });
    }
    default:
      return true;
  }
}

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(INITIAL_ANSWERS);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { resetQuiz, updateAnswer } = useQuiz();
  const { showPaywall } = usePro();

  const slide = SLIDES[index];
  const total = SLIDES.length;

  useEffect(() => {
    storage.removeItem(STORAGE_KEYS.onboardingProfile).catch(() => undefined);
  }, []);

  function setAnswer<K extends OnboardingAnswerField>(field: K, value: OnboardingAnswers[K]) {
    setAnswers((current) => ({ ...current, [field]: value }));
  }

  function transitionTo(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(total - 1, nextIndex));
    const direction = boundedIndex > index ? 1 : -1;
    if (boundedIndex === index) return;

    Animated.parallel([
      Animated.timing(fadeAnim, { duration: 80, toValue: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { duration: 80, toValue: 18 * direction, useNativeDriver: true }),
    ]).start(() => {
      setIndex(boundedIndex);
      slideAnim.setValue(-22 * direction);
      Animated.parallel([
        Animated.timing(fadeAnim, { duration: 160, toValue: 1, useNativeDriver: true }),
        Animated.timing(slideAnim, { duration: 160, toValue: 0, useNativeDriver: true }),
      ]).start();
    });
  }

  function continueAfterPaywall() {
    router.replace('/quiz/1');
  }

  async function finishOnboarding(options: FinishOptions = {}) {
    if (finishing && !finishError) return;

    setFinishing(true);
    setFinishError(null);
    const profileAnswers = cleanAnswers(answers);
    const profile = {
      answers: profileAnswers,
      completedAt: new Date().toISOString(),
      schemaVersion: 1,
      skipped: Boolean(options.skipped),
    };

    resetQuiz();
    if (profileAnswers.primaryGoal) {
      updateAnswer('primaryGoal', profileAnswers.primaryGoal);
    }
    if (profileAnswers.experience) {
      updateAnswer('experienceLevel', experienceToQuizExperience[profileAnswers.experience]);
    }
    const ageRange = ageToRange(profileAnswers.age);
    if (ageRange) {
      updateAnswer('ageRange', ageRange);
    }

    await storage.setItem(STORAGE_KEYS.onboardingProfile, JSON.stringify(profile));
    if (profileAnswers.name) {
      await storage.setItem(STORAGE_KEYS.profileName, profileAnswers.name);
    }
    await storage.setItem(STORAGE_KEYS.hasOnboarded, 'true');
    hapticSuccess();
    const paywallResult = await showPaywallWithTimeout(showPaywall);
    if (paywallResult.status === 'timeout') {
      setFinishError('The trial check is taking longer than expected. Your dossier is saved, and you can continue or retry the check.');
      return;
    }
    continueAfterPaywall();
  }

  function goNext() {
    if (finishing || !slideIsComplete(slide, answers)) return;

    if (index >= total - 1) {
      void finishOnboarding();
      return;
    }

    transitionTo(index + 1);
  }

  function goBack() {
    if (finishing || index <= 0) return;
    transitionTo(index - 1);
  }

  function skip() {
    void finishOnboarding({ skipped: true });
  }

  function setCurrentStack(values: string[]) {
    if (values.includes('nothing-yet')) {
      setAnswers((current) => ({ ...current, currentStack: [], noCurrentStack: true }));
      return;
    }

    setAnswers((current) => ({
      ...current,
      currentStack: sanitizeCurrentStack(values),
      noCurrentStack: false,
    }));
  }

  function renderSlide() {
    switch (slide.kind) {
      case 'hero':
        return <HeroSlide slide={slide} />;
      case 'picker':
        return (
          <PickerSlide
            onChange={(value) => {
              hapticSelection();
              setAnswer(slide.field, value as never);
            }}
            slide={slide}
            value={answers[slide.field] as string | number | undefined}
          />
        );
      case 'multi':
        return (
          <MultiSelectSlide
            onChange={(value) => {
              hapticSelection();
              if (slide.field === 'currentStack') {
                setCurrentStack(value);
              } else {
                setAnswer(slide.field, value as never);
              }
            }}
            slide={slide}
            values={
              slide.field === 'currentStack' && answers.noCurrentStack
                ? ['nothing-yet']
                : ((answers[slide.field] as string[] | undefined) ?? [])
            }
          />
        );
      case 'guidelines':
        return (
          <GuidelinesSlide
            onChange={(value) => {
              hapticSelection();
              setAnswer('guidelinesAccepted', value);
            }}
            slide={slide}
            values={answers.guidelinesAccepted ?? []}
          />
        );
      case 'slider':
        return (
          <SliderSlide
            onChange={(value) => {
              hapticSelection();
              setAnswer(slide.field, value);
            }}
            slide={slide}
            value={answers[slide.field]}
          />
        );
      case 'toggle':
        return (
          <ToggleSlide
            onAccept={() => {
              if (slide.field) {
                hapticSelection();
                setAnswer(slide.field, true);
              }
            }}
            onDecline={() => {
              if (slide.field) {
                hapticSelection();
                setAnswer(slide.field, false);
              }
            }}
            slide={slide}
            value={slide.field ? answers[slide.field] : undefined}
          />
        );
      case 'input':
        return <InputSlide onChange={setAnswer} slide={slide} values={answers} />;
      case 'loader':
        return <LoaderSlide onDone={() => transitionTo(index + 1)} slide={slide} />;
      case 'reveal':
        return <RevealSlide answers={answers} slide={slide} />;
      default:
        return null;
    }
  }

  const canContinue = slideIsComplete(slide, answers);
  const ctaLabel = slide.kind === 'loader' ? 'Building dossier' : slide.cta ?? 'Continue';
  const ctaIcon = index >= total - 1 ? 'sparkles-outline' : undefined;

  if (finishing || finishError) {
    return (
      <TrialAccessState
        error={finishError}
        onContinue={continueAfterPaywall}
        onRetry={() => {
          setFinishing(false);
          setFinishError(null);
          void finishOnboarding();
        }}
        title="Unlocking your research workspace"
      />
    );
  }

  return (
    <OnboardingShell
      ctaDisabled={finishing || !canContinue}
      ctaIcon={ctaIcon}
      ctaLabel={ctaLabel}
      ctaLoading={finishing}
      index={index}
      onBack={goBack}
      onCtaPress={goNext}
      onSkip={skip}
      total={total}>
      <Animated.View style={[styles.slide, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {renderSlide()}
      </Animated.View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: '100%',
  },
});
