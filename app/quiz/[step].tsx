import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizOption } from '@/components/QuizOption';
import { colors } from '@/lib/constants/colors';
import { goals } from '@/lib/constants/goals';
import { fonts } from '@/lib/constants/typography';
import { useQuiz } from '@/lib/hooks/useQuiz';
import type { GoalTag } from '@/types/compound';
import type {
  AgeRange,
  BudgetPreference,
  ExperienceLevel,
  InjectionComfort,
  QuizAnswers,
  QuizConcern,
  ResultPreference,
  SkinSensitivity,
  SkinTexture,
  SupplementHistory,
} from '@/types/quiz';

type StepKey = keyof QuizAnswers;
type SingleValue =
  | GoalTag
  | AgeRange
  | ExperienceLevel
  | InjectionComfort
  | BudgetPreference
  | SupplementHistory
  | SkinTexture
  | SkinSensitivity
  | ResultPreference;

interface Option {
  label: string;
  description?: string;
  value: SingleValue | QuizConcern;
}

const questionConfigs: Record<number, { key: StepKey; title: string; subtitle: string; multiSelect?: boolean; options: Option[] }> = {
  1: {
    key: 'primaryGoal',
    title: 'What should your routine prioritize?',
    subtitle: 'Pick the main outcome. We use it to rank the educational shortlist.',
    options: goals.map((goal) => ({
      description: goal.description,
      label: goal.title,
      value: goal.id,
    })),
  },
  2: {
    key: 'ageRange',
    title: 'What age range are you in?',
    subtitle: 'Age helps tune the longevity and appearance priorities without asking for unnecessary detail.',
    options: ['18-25', '26-35', '36-45', '46-55', '55+'].map((value) => ({
      label: value,
      value: value as AgeRange,
    })),
  },
  3: {
    key: 'experienceLevel',
    title: 'How familiar are you with peptides?',
    subtitle: 'This keeps recommendations appropriate to your experience level.',
    options: [
      { label: 'New to this', description: 'Keep the shortlist simple and conservative.', value: 'never' as ExperienceLevel },
      { label: 'Know the basics', description: 'You understand supplements and skincare actives.', value: 'some' as ExperienceLevel },
      { label: 'Some peptide experience', description: 'You are comfortable comparing options.', value: 'experienced' as ExperienceLevel },
      { label: 'Advanced', description: 'Show the wider research landscape.', value: 'deep' as ExperienceLevel },
    ],
  },
  4: {
    key: 'concerns',
    title: 'Which appearance signals matter most?',
    subtitle: 'Pick one or more. These shape which peptides and tracking categories rise to the top.',
    multiSelect: true,
    options: [
      { label: 'Dryness', description: 'Skin feels tight or depleted.', value: 'dryness' as QuizConcern },
      { label: 'Uneven skin', description: 'Roughness, pores, or post-acne marks.', value: 'uneven-texture' as QuizConcern },
      { label: 'Redness', description: 'Visible irritation or blotchiness.', value: 'redness' as QuizConcern },
      { label: 'Fine lines', description: 'Early aging and firmness concerns.', value: 'fine-lines' as QuizConcern },
      { label: 'Dullness', description: 'Skin looks flat or tired.', value: 'dullness' as QuizConcern },
      { label: 'Sensitivity', description: 'Skin reacts easily to new products.', value: 'sensitivity' as QuizConcern },
    ],
  },
  5: {
    key: 'injectionComfort',
    title: 'Which routes are you open to tracking?',
    subtitle: 'This controls whether injection-heavy options appear in the shortlist.',
    options: [
      { label: 'Fine with it', description: 'Keep every route available.', value: 'fine' as InjectionComfort },
      { label: 'Prefer oral/nasal', description: 'Still open, but easier routes should rank higher.', value: 'prefer-other' as InjectionComfort },
      { label: 'No way', description: 'Remove injection-only picks.', value: 'no-way' as InjectionComfort },
    ],
  },
  6: {
    key: 'budget',
    title: 'What monthly range feels realistic?',
    subtitle: 'Budget keeps the shortlist grounded instead of aspirational.',
    options: [
      { label: 'Under $50', value: 'under-50' as BudgetPreference },
      { label: '$50-$100', value: '50-100' as BudgetPreference },
      { label: '$100-$200', value: '100-200' as BudgetPreference },
      { label: "Money's not the issue", value: 'unlimited' as BudgetPreference },
    ],
  },
  7: {
    key: 'supplementHistory',
    title: 'What is already in your routine?',
    subtitle: 'This helps avoid recommendations that duplicate what you already track.',
    options: [
      { label: 'Nothing right now', value: 'none' as SupplementHistory },
      { label: 'Basic vitamins / minerals', description: 'The staples like D3, magnesium, fish oil.', value: 'basic-vitamins' as SupplementHistory },
      { label: 'Some skincare actives', description: 'Things like retinoids, acids, or vitamin C.', value: 'some-actives' as SupplementHistory },
      { label: 'Already on peptides', description: 'You have used peptide products before.', value: 'already-peptides' as SupplementHistory },
    ],
  },
  8: {
    key: 'skinTexture',
    title: 'How smooth does your skin look now?',
    subtitle: 'This separates smooth-canvas support from hydration or barrier-first support.',
    options: [
      { label: 'Smooth', description: 'Mostly even and calm.', value: 'smooth' as SkinTexture },
      { label: 'Some unevenness', description: 'A few rough or uneven areas.', value: 'some-unevenness' as SkinTexture },
      { label: 'Rough', description: 'Smoothness is a clear concern.', value: 'rough' as SkinTexture },
      { label: 'Bumpy', description: 'Congestion or bumps are noticeable.', value: 'bumpy' as SkinTexture },
    ],
  },
  9: {
    key: 'skinSensitivity',
    title: 'How reactive is your skin?',
    subtitle: 'Reactive skin should start with lower-friction, barrier-first options.',
    options: [
      { label: 'Very tolerant', value: 'tolerant' as SkinSensitivity },
      { label: 'Mild reaction sometimes', value: 'mild-reaction' as SkinSensitivity },
      { label: 'Often irritated', value: 'often-irritated' as SkinSensitivity },
      { label: 'Highly reactive', value: 'highly-reactive' as SkinSensitivity },
    ],
  },
  10: {
    key: 'resultPreference',
    title: 'How should we rank the final shortlist?',
    subtitle: 'This sets the balance between visible wins, longevity, and conservative tracking.',
    options: [
      { label: 'Quick wins I can see soon', description: 'Peptides known for noticeable short-term skin effects.', value: 'quick-wins' as ResultPreference },
      { label: 'Long-term skin optimization', description: 'Slower build, compounding benefits over months.', value: 'long-term' as ResultPreference },
      { label: 'Targeting a specific concern', description: 'Focused support for something that is bothering you.', value: 'recovery-specific' as ResultPreference },
      { label: 'General skin wellness', description: 'A balanced, low-risk starting point.', value: 'general-wellness' as ResultPreference },
    ],
  },
};

export default function QuizStepScreen() {
  const params = useLocalSearchParams<{ step: string }>();
  const step = Number(params.step);
  const config = questionConfigs[step];
  const { generateResult, isReady, quizAnswers, updateAnswer } = useQuiz();

  const [selectedValue, setSelectedValue] = useState<SingleValue | null>(
    config && !config.multiSelect ? ((quizAnswers[config.key] as SingleValue | undefined) ?? null) : null,
  );
  const [selectedConcerns, setSelectedConcerns] = useState<QuizConcern[]>(
    config?.multiSelect ? ((quizAnswers.concerns as QuizConcern[] | undefined) ?? []) : [],
  );

  useEffect(() => {
    if (!config) {
      router.replace('/quiz/1');
    }
  }, [config]);

  useEffect(() => {
    if (!config) {
      return;
    }

    if (config.multiSelect) {
      setSelectedConcerns((quizAnswers.concerns as QuizConcern[] | undefined) ?? []);
      setSelectedValue(null);
      return;
    }

    setSelectedValue((quizAnswers[config.key] as SingleValue | undefined) ?? null);
    setSelectedConcerns([]);
  }, [config, quizAnswers]);

  if (!config) {
    return null;
  }

  if (!isReady) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const canContinue = config.multiSelect ? selectedConcerns.length > 0 : Boolean(selectedValue);

  function goForward() {
    if (!canContinue) {
      return;
    }

    if (config.multiSelect) {
      updateAnswer('concerns', selectedConcerns);
    } else if (selectedValue) {
      updateAnswer(config.key as Exclude<StepKey, 'concerns'>, selectedValue as never);
    }

    if (step < 10) {
      router.push(`/quiz/${step + 1}`);
      return;
    }

    const nextAnswers: QuizAnswers = {
      ...(quizAnswers as QuizAnswers),
      resultPreference: selectedValue as ResultPreference,
    };
    generateResult(nextAnswers);
    router.replace('/quiz/results');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => (step === 1 ? router.replace('/quiz') : router.back())}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.progress}>Step {step} of 10</Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/ai')}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={20} />
          </Pressable>
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>

        <View style={styles.options}>
          {config.options.map((option) => {
            const isSelected = config.multiSelect
              ? selectedConcerns.includes(option.value as QuizConcern)
              : selectedValue === option.value;

            return (
              <QuizOption
                description={option.description}
                isSelected={isSelected}
                key={option.label}
                label={option.label}
                multiSelect={config.multiSelect}
                onPress={() => {
                  if (config.multiSelect) {
                    setSelectedConcerns((current) =>
                      current.includes(option.value as QuizConcern)
                        ? current.filter((value) => value !== option.value)
                        : [...current, option.value as QuizConcern],
                    );
                    return;
                  }

                  setSelectedValue(option.value as SingleValue);
                }}
              />
            );
          })}
        </View>

        <Pressable
          disabled={!canContinue}
          onPress={goForward}
          style={({ pressed }) => [
            styles.primaryButton,
            !canContinue && styles.primaryButtonDisabled,
            pressed && canContinue && styles.pressed,
          ]}>
          <Text style={styles.primaryButtonText}>{step === 10 ? 'See My Routine' : 'Continue'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 150,
  },
  loaderWrap: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backButton: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  progress: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 30,
    letterSpacing: -0.7,
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  options: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 17,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});
