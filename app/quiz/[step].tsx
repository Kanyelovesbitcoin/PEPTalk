import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrialAccessState } from '@/components/TrialAccessState';
import { colors } from '@/lib/constants/colors';
import { goals } from '@/lib/constants/goals';
import { rhythm } from '@/lib/constants/layout';
import { fonts, type as t } from '@/lib/constants/typography';
import { usePro } from '@/lib/hooks/usePro';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { setFreeModeNotice } from '@/lib/utils/freeModeNotice';
import { hapticSelection, hapticSuccess } from '@/lib/utils/haptics';
import { showPaywallWithTimeout } from '@/lib/utils/paywallTimeout';
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
type StepVariant = 'goal' | 'cards' | 'chips' | 'ladder' | 'route';

interface Option {
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: SingleValue | QuizConcern;
}

interface QuestionConfig {
  key: StepKey;
  multiSelect?: boolean;
  options: Option[];
  subtitle: string;
  title: string;
  variant?: StepVariant;
}

const TOTAL_STEPS = 10;

const questionConfigs: Record<number, QuestionConfig> = {
  1: {
    key: 'primaryGoal',
    title: 'What research area should Glowmax organize?',
    subtitle: 'Start with the educational context that matters most. You can rerun around another area later.',
    variant: 'goal',
    options: goals.map((goal) => ({
      description: goal.description,
      icon: goal.icon as keyof typeof Ionicons.glyphMap,
      label: goal.title,
      value: goal.id,
    })),
  },
  2: {
    key: 'ageRange',
    title: 'Where are you in the timeline?',
    subtitle: 'Age helps sort research and cosmetic context without asking for unnecessary detail.',
    variant: 'chips',
    options: ['18-25', '26-35', '36-45', '46-55', '55+'].map((value) => ({
      label: value,
      value: value as AgeRange,
    })),
  },
  3: {
    key: 'experienceLevel',
    title: 'How fluent are you with peptides?',
    subtitle: 'This decides how simple, conservative, or research-heavy the educational saved should feel.',
    options: [
      { label: 'New to this', description: 'Keep your saved items simple and conservative.', icon: 'leaf-outline', value: 'never' as ExperienceLevel },
      { label: 'Know the basics', description: 'You understand supplements and skincare actives.', icon: 'book-outline', value: 'some' as ExperienceLevel },
      { label: 'Some peptide experience', description: 'You are comfortable comparing options.', icon: 'flask-outline', value: 'experienced' as ExperienceLevel },
      { label: 'Advanced', description: 'Show the wider research landscape.', icon: 'compass-outline', value: 'deep' as ExperienceLevel },
    ],
  },
  4: {
    key: 'concerns',
    title: 'Which cosmetic signals matter most?',
    subtitle: 'Pick one or more. These shape which research and tracking categories rise to the top.',
    multiSelect: true,
    variant: 'chips',
    options: [
      { label: 'Dryness', icon: 'water-outline', value: 'dryness' as QuizConcern },
      { label: 'Uneven skin', icon: 'grid-outline', value: 'uneven-texture' as QuizConcern },
      { label: 'Redness', icon: 'rose-outline', value: 'redness' as QuizConcern },
      { label: 'Fine lines', icon: 'pulse-outline', value: 'fine-lines' as QuizConcern },
      { label: 'Dullness', icon: 'contrast-outline', value: 'dullness' as QuizConcern },
      { label: 'Sensitivity', icon: 'shield-outline', value: 'sensitivity' as QuizConcern },
    ],
  },
  5: {
    key: 'injectionComfort',
    title: 'Which routes are you open to tracking?',
    subtitle: 'This controls whether entries with non-oral research contexts appear in your saved items.',
    variant: 'route',
    options: [
      { label: 'Show all context', description: 'Include every route category as research context.', icon: 'checkmark-circle-outline', value: 'fine' as InjectionComfort },
      { label: 'Prefer non-injection', description: 'Rank non-injection entries higher.', icon: 'swap-horizontal-outline', value: 'prefer-other' as InjectionComfort },
      { label: 'Exclude injection-only', description: 'Remove entries that are injection-only in the library.', icon: 'close-circle-outline', value: 'no-way' as InjectionComfort },
    ],
  },
  6: {
    key: 'budget',
    title: 'How broad should the research list be?',
    subtitle: 'This keeps your saved items focused instead of overwhelming. It is not purchase guidance.',
    variant: 'ladder',
    options: [
      { label: 'Very focused', value: 'under-50' as BudgetPreference },
      { label: 'Focused plus', value: '50-100' as BudgetPreference },
      { label: 'Broader context', value: '100-200' as BudgetPreference },
      { label: 'Full landscape', value: 'unlimited' as BudgetPreference },
    ],
  },
  7: {
    key: 'supplementHistory',
    title: 'What do you already track?',
    subtitle: 'This helps avoid a saved items that duplicates your existing notes.',
    options: [
      { label: 'Nothing right now', icon: 'remove-circle-outline', value: 'none' as SupplementHistory },
      { label: 'Basic vitamins / minerals', description: 'D3, magnesium, fish oil, and staples.', icon: 'nutrition-outline', value: 'basic-vitamins' as SupplementHistory },
      { label: 'Some skincare actives', description: 'Retinoids, acids, vitamin C, or similar.', icon: 'sparkles-outline', value: 'some-actives' as SupplementHistory },
      { label: 'Peptide research notes', description: 'You already track peptide-related information.', icon: 'flask-outline', value: 'already-peptides' as SupplementHistory },
    ],
  },
  8: {
    key: 'skinTexture',
    title: 'How smooth does your skin look now?',
    subtitle: 'This separates smooth-canvas support from hydration or barrier-first support.',
    variant: 'ladder',
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
    variant: 'ladder',
    options: [
      { label: 'Very tolerant', value: 'tolerant' as SkinSensitivity },
      { label: 'Mild reaction sometimes', value: 'mild-reaction' as SkinSensitivity },
      { label: 'Often irritated', value: 'often-irritated' as SkinSensitivity },
      { label: 'Highly reactive', value: 'highly-reactive' as SkinSensitivity },
    ],
  },
  10: {
    key: 'resultPreference',
    title: 'How should we rank the Glowmax saved items?',
    subtitle: 'Set the balance between cosmetic context, long-horizon research, and conservative tracking.',
    options: [
      { label: 'Cosmetic context first', description: 'Visible skin-appearance literature.', icon: 'flash-outline', value: 'quick-wins' as ResultPreference },
      { label: 'Long-horizon research', description: 'Slower, evidence-literacy context.', icon: 'time-outline', value: 'long-term' as ResultPreference },
      { label: 'Specific concern context', description: 'Focused education for your chosen category.', icon: 'locate-outline', value: 'recovery-specific' as ResultPreference },
      { label: 'General education', description: 'A balanced, conservative starting point.', icon: 'leaf-outline', value: 'general-wellness' as ResultPreference },
    ],
  },
};

function answerForConfig(config: QuestionConfig, answers: Partial<QuizAnswers>) {
  if (config.multiSelect) {
    return null;
  }

  return (answers[config.key] as SingleValue | undefined) ?? null;
}

export default function QuizStepScreen() {
  const params = useLocalSearchParams<{ step: string }>();
  const step = Number(params.step);
  const config = questionConfigs[step];
  const { isPro, isReady: proReady, showPaywall } = usePro();
  const { generateResult, isReady, quizAnswers, updateAnswer } = useQuiz();
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [selectedValue, setSelectedValue] = useState<SingleValue | null>(
    config ? answerForConfig(config, quizAnswers) : null,
  );
  const [selectedConcerns, setSelectedConcerns] = useState<QuizConcern[]>(
    config?.multiSelect ? ((quizAnswers.concerns as QuizConcern[] | undefined) ?? []) : [],
  );
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buildPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!config) {
      router.replace('/quiz/1');
    }
  }, [config]);

  useEffect(() => {
    if (!proReady || isPro || checkingAccess || accessError) {
      return;
    }

    let active = true;
    setCheckingAccess(true);
    showPaywallWithTimeout(showPaywall).then(async (paywallResult) => {
      if (!active) {
        return;
      }

      if (paywallResult.status === 'timeout') {
        setCheckingAccess(false);
        setAccessError('The trial check is taking longer than expected. You can retry or return to the workspace.');
        return;
      }

      const { result } = paywallResult;
      if (!result.didUnlock) {
        await setFreeModeNotice('The deep guide is locked until trial starts. Free mode is ready with Library, Today\'s Rotation, and local logs.');
      }
      router.replace(result.didUnlock ? `/quiz/${Number.isFinite(step) && step >= 1 ? step : 1}` : '/(tabs)');
    });

    return () => {
      active = false;
    };
  }, [accessError, checkingAccess, isPro, proReady, showPaywall, step]);

  useEffect(() => {
    if (!config) {
      return;
    }

    if (config.multiSelect) {
      setSelectedConcerns((quizAnswers.concerns as QuizConcern[] | undefined) ?? []);
      setSelectedValue(null);
      return;
    }

    setSelectedValue(answerForConfig(config, quizAnswers));
    setSelectedConcerns([]);
  }, [config, quizAnswers]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { duration: 170, toValue: 1, useNativeDriver: true }),
      Animated.timing(slideAnim, { duration: 170, toValue: 0, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, step]);

  useEffect(() => {
    if (!building) {
      buildPulse.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(buildPulse, { duration: 620, toValue: 1, useNativeDriver: true }),
        Animated.timing(buildPulse, { duration: 620, toValue: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [buildPulse, building]);

  const canContinue = config?.multiSelect ? selectedConcerns.length > 0 : Boolean(selectedValue);
  const progressDots = useMemo(() => Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1), []);

  if (!config) {
    return null;
  }

  if (!proReady || checkingAccess || accessError || !isPro || !isReady) {
    return (
      <TrialAccessState
        error={accessError}
        onContinue={() => router.replace('/(tabs)')}
        onRetry={() => {
          setAccessError(null);
          setCheckingAccess(false);
        }}
        title="Preparing research workspace"
      />
    );
  }

  if (building) {
    const pulseScale = buildPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
    const pulseOpacity = buildPulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.1] });

    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.buildWrap}>
          <Animated.View style={[styles.buildHalo, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
          <Ionicons color={colors.accent} name="sparkles" size={40} />
          <Text style={styles.buildTitle}>Building your Glowmax saved items.</Text>
          <Text style={styles.buildCopy}>Matching goals, skin signals, route context, and research breadth.</Text>
        </View>
      </SafeAreaView>
    );
  }

  function animateForward(next: () => void) {
    Animated.parallel([
      Animated.timing(fadeAnim, { duration: 100, toValue: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, { duration: 100, toValue: 24, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(-22);
      next();
    });
  }

  function selectOption(option: Option) {
    hapticSelection();
    if (config.multiSelect) {
      setSelectedConcerns((current) =>
        current.includes(option.value as QuizConcern)
          ? current.filter((value) => value !== option.value)
          : [...current, option.value as QuizConcern],
      );
      return;
    }

    setSelectedValue(option.value as SingleValue);
  }

  function goForward() {
    if (!canContinue) {
      return;
    }

    const nextAnswers = {
      ...quizAnswers,
      [config.key]: config.multiSelect ? selectedConcerns : selectedValue,
    } as QuizAnswers;

    if (config.multiSelect) {
      updateAnswer('concerns', selectedConcerns);
    } else if (selectedValue) {
      updateAnswer(config.key as Exclude<StepKey, 'concerns'>, selectedValue as never);
    }

    if (step < TOTAL_STEPS) {
      animateForward(() => router.push(`/quiz/${step + 1}`));
      return;
    }

    hapticSuccess();
    setBuilding(true);
    generateResult(nextAnswers);
    setTimeout(() => router.replace('/quiz/results'), 980);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => (step === 1 ? router.replace('/quiz') : router.back())}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="arrow-back" size={18} />
          </Pressable>
          <View style={styles.progressBarWrap}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
            </View>
          </View>
          <Pressable
            accessibilityLabel="Close guide"
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)/ai')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={18} />
          </Pressable>
        </View>

        <Animated.View style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.kicker}>STEP {step} OF {TOTAL_STEPS}</Text>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>

            <View style={[styles.options, config.variant === 'chips' && styles.chipOptions]}>
              {config.options.map((option, index) => {
                const isSelected = config.multiSelect
                  ? selectedConcerns.includes(option.value as QuizConcern)
                  : selectedValue === option.value;
                return (
                  <OptionControl
                    index={index}
                    isSelected={isSelected}
                    key={option.label}
                    multiSelect={config.multiSelect}
                    onPress={() => selectOption(option)}
                    option={option}
                    variant={config.variant ?? 'cards'}
                  />
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>

        <View style={styles.bottomBar}>
          <Pressable
            accessibilityLabel={step === TOTAL_STEPS ? 'See my Glowmax saved items' : 'Continue'}
            accessibilityRole="button"
            disabled={!canContinue}
            onPress={goForward}
            style={({ pressed }) => [
              styles.primaryButton,
              !canContinue && styles.primaryButtonDisabled,
              pressed && canContinue && styles.pressed,
            ]}>
            <Text style={styles.primaryButtonText}>{step === TOTAL_STEPS ? 'See my Glowmax saved items' : 'Continue'}</Text>
            <Ionicons color={colors.accentInk} name={step === TOTAL_STEPS ? 'sparkles' : 'arrow-forward'} size={18} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OptionControl({
  index,
  isSelected,
  multiSelect,
  onPress,
  option,
  variant,
}: {
  index: number;
  isSelected: boolean;
  multiSelect?: boolean;
  onPress: () => void;
  option: Option;
  variant: StepVariant;
}) {
  if (variant === 'chips') {
    return (
      <Pressable
        accessibilityLabel={option.label}
        accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
        accessibilityState={multiSelect ? { checked: isSelected } : { selected: isSelected }}
        onPress={onPress}
        style={({ pressed }) => [styles.chip, isSelected && styles.chipSelected, pressed && styles.pressed]}>
        {option.icon ? <Ionicons color={isSelected ? colors.accentInk : colors.accent} name={option.icon} size={16} /> : null}
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option.label}</Text>
      </Pressable>
    );
  }

  if (variant === 'ladder') {
    return (
      <Pressable
        accessibilityLabel={option.description ? `${option.label}. ${option.description}` : option.label}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        style={({ pressed }) => [styles.ladderRow, isSelected && styles.optionSelected, pressed && styles.pressed]}>
        <Text style={[styles.ladderNum, isSelected && styles.optionAccent]}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>{option.label}</Text>
          {option.description ? <Text style={styles.optionDescription}>{option.description}</Text> : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={option.description ? `${option.label}. ${option.description}` : option.label}
      accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
      accessibilityState={multiSelect ? { checked: isSelected } : { selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        variant === 'goal' && styles.goalOption,
        variant === 'route' && styles.routeOption,
        isSelected && styles.optionSelected,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
        {option.icon ? <Ionicons color={isSelected ? colors.accentInk : colors.accent} name={option.icon} size={21} /> : null}
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{option.label}</Text>
        {option.description ? <Text style={styles.optionDescription}>{option.description}</Text> : null}
      </View>
      <Ionicons color={isSelected ? colors.accent : colors.textFaint} name={multiSelect ? 'checkmark-circle' : 'radio-button-on'} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  shell: {
    flex: 1,
    paddingBottom: 18,
    paddingHorizontal: rhythm.screenX,
    paddingTop: rhythm.screenTop,
  },
  loaderWrap: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingHorizontal: rhythm.screenX,
  },
  loaderText: { ...t.bodySmall, color: colors.textMuted, textAlign: 'center' },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  progressBarWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progressBarTrack: { backgroundColor: 'rgba(239,231,210,0.10)', borderRadius: 999, height: 4, overflow: 'hidden', width: '100%' },
  progressBarFill: { backgroundColor: colors.accent, borderRadius: 999, height: 4 },
  body: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingTop: 10,
  },
  kicker: { ...t.eyebrow, color: colors.accent, letterSpacing: 1.3, marginBottom: 14 },
  title: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 38,
    letterSpacing: 0,
    lineHeight: 42,
    marginBottom: 14,
    maxWidth: 345,
  },
  subtitle: { ...t.body, color: colors.textMuted, lineHeight: 24, marginBottom: 24, maxWidth: 340 },
  options: { gap: 12 },
  chipOptions: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 82,
    padding: 14,
  },
  goalOption: {
    alignItems: 'flex-start',
    minHeight: 98,
  },
  routeOption: {
    minHeight: 94,
  },
  optionSelected: {
    backgroundColor: `${colors.accent}18`,
    borderColor: colors.accent,
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  optionIconSelected: { backgroundColor: colors.accent },
  optionCopy: { flex: 1, gap: 4 },
  optionTitle: { ...t.label, color: colors.text, fontSize: 15 },
  optionDescription: { ...t.bodySmall, color: colors.textMuted, lineHeight: 19 },
  optionAccent: { color: colors.accent },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 15,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: { ...t.label, color: colors.text, fontSize: 14 },
  chipTextSelected: { color: colors.accentInk },
  ladderRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  ladderNum: {
    color: colors.textDim,
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 1,
  },
  bottomBar: { paddingTop: 12 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: { opacity: 0.46 },
  primaryButtonText: { ...t.label, color: colors.accentInk, fontSize: 15 },
  buildWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: rhythm.screenX,
  },
  buildHalo: {
    backgroundColor: colors.glow,
    borderRadius: 999,
    height: 150,
    position: 'absolute',
    width: 150,
  },
  buildTitle: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 38,
    letterSpacing: 0,
    lineHeight: 42,
    marginTop: 24,
    textAlign: 'center',
  },
  buildCopy: { ...t.bodySmall, color: colors.textMuted, marginTop: 10, maxWidth: 270, textAlign: 'center' },
  pressed: { opacity: 0.86 },
});
