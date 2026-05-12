import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizOption } from '@/components/QuizOption';
import { colors } from '@/lib/constants/colors';
import { rhythm } from '@/lib/constants/layout';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { fonts, type as t } from '@/lib/constants/typography';
import type {
  SkinQuizRecommendation,
  SkinActive,
  SkinPrimaryConcern,
  SkinQuizAnswers,
  SkinSunExposure,
  SkinType,
} from '@/lib/data/skinQuizRecommendations';
import { getSkinQuizRecommendations } from '@/lib/data/skinQuizRecommendations';
import { storage } from '@/lib/utils/storage';
import { parseJsonValue, setJsonItem } from '@/lib/utils/storageJson';

type StepKey = keyof SkinQuizAnswers;
type SingleStepValue = SkinPrimaryConcern | SkinSunExposure | 'yes' | 'no' | SkinType;

interface StoredSkinQuizResult {
  answers: SkinQuizAnswers;
  completedAt?: string;
  recommendations?: SkinQuizRecommendation[];
}

interface StepConfig {
  key: StepKey;
  multiSelect?: boolean;
  options?: Array<{ label: string; value: string }>;
  subtitle: string;
  title: string;
  type?: 'scale';
}

const TOTAL_STEPS = 7;

const stepConfigs: Record<number, StepConfig> = {
  1: {
    key: 'primaryConcern',
    title: 'What is your primary skin concern?',
    subtitle: 'Choose the one you want this one-time analysis to prioritize.',
    options: [
      { label: 'Acne', value: 'acne' },
      { label: 'Redness', value: 'redness' },
      { label: 'Dullness', value: 'dullness' },
      { label: 'Aging', value: 'aging' },
      { label: 'Oiliness', value: 'oiliness' },
      { label: 'Dryness', value: 'dryness' },
    ],
  },
  2: {
    key: 'stressLevel',
    title: 'How high is your stress level lately?',
    subtitle: 'Select from 1 (low) to 5 (high).',
    type: 'scale',
  },
  3: {
    key: 'sunExposure',
    title: 'How much sun exposure do you get?',
    subtitle: 'Choose what best matches most weeks.',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
    ],
  },
  4: {
    key: 'activeBreakouts',
    title: 'Do you have active breakouts right now?',
    subtitle: 'This helps shape how conservative your recommendation should be.',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  5: {
    key: 'rednessSensitivity',
    title: 'Do you notice redness or sensitivity?',
    subtitle: 'Include your current baseline, not just occasional flare-ups.',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  6: {
    key: 'skinType',
    title: 'What is your skin type?',
    subtitle: 'Pick the closest match.',
    options: [
      { label: 'Oily', value: 'oily' },
      { label: 'Dry', value: 'dry' },
      { label: 'Combination', value: 'combo' },
      { label: 'Normal', value: 'normal' },
    ],
  },
  7: {
    key: 'currentActives',
    title: 'Which actives are currently in your routine?',
    subtitle: 'Select all that apply.',
    multiSelect: true,
    options: [
      { label: 'Retinoid', value: 'retinoid' },
      { label: 'Vitamin C', value: 'vitamin-c' },
      { label: 'Niacinamide', value: 'niacinamide' },
      { label: 'None', value: 'none' },
    ],
  },
};

function getDefaultAnswers(): Partial<SkinQuizAnswers> {
  return {};
}

export default function SkinQuizStepScreen() {
  const params = useLocalSearchParams<{ step: string }>();
  const step = Number(params.step);
  const config = stepConfigs[step];
  const [answers, setAnswers] = useState<Partial<SkinQuizAnswers>>(getDefaultAnswers());
  const [isReady, setIsReady] = useState(false);
  const [selectedValue, setSelectedValue] = useState<SingleStepValue | null>(null);
  const [selectedMulti, setSelectedMulti] = useState<SkinActive[]>([]);
  const [stressLevel, setStressLevel] = useState<1 | 2 | 3 | 4 | 5>(3);

  useEffect(() => {
    if (!config) {
      router.replace('/skin-quiz/1' as never);
      return;
    }

    let active = true;
    storage
      .getItem(STORAGE_KEYS.skinQuizResult)
      .then((stored) => {
        if (!active) return;
        const parsed = parseJsonValue<StoredSkinQuizResult | null>(
          stored,
          null,
          STORAGE_KEYS.skinQuizResult,
        );
        if (parsed?.answers) {
          setAnswers(parsed.answers);
        }
      })
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, [config]);

  useEffect(() => {
    if (!config) return;
    const existing = answers[config.key];
    if (config.type === 'scale') {
      setStressLevel((existing as 1 | 2 | 3 | 4 | 5 | undefined) ?? 3);
      setSelectedValue(null);
      setSelectedMulti([]);
      return;
    }
    if (config.multiSelect) {
      setSelectedMulti((existing as SkinActive[] | undefined) ?? []);
      setSelectedValue(null);
      return;
    }
    setSelectedValue((existing as SingleStepValue | undefined) ?? null);
    setSelectedMulti([]);
  }, [answers, config]);

  const canContinue = useMemo(() => {
    if (!config) return false;
    if (config.type === 'scale') return true;
    if (config.multiSelect) return selectedMulti.length > 0;
    return Boolean(selectedValue);
  }, [config, selectedMulti.length, selectedValue]);

  if (!config || !isReady) {
    return null;
  }

  function saveAndGoForward() {
    const nextAnswers: Partial<SkinQuizAnswers> = { ...answers };
    if (config.type === 'scale') {
      nextAnswers.stressLevel = stressLevel;
    } else if (config.multiSelect) {
      nextAnswers.currentActives = selectedMulti;
    } else if (selectedValue) {
      nextAnswers[config.key] = selectedValue as never;
    }
    setAnswers(nextAnswers);

    if (step < TOTAL_STEPS) {
      router.push(`/skin-quiz/${step + 1}` as never);
      return;
    }

    const finalAnswers = nextAnswers as SkinQuizAnswers;
    void setJsonItem(
      STORAGE_KEYS.skinQuizResult,
      {
        answers: finalAnswers,
        completedAt: new Date().toISOString(),
        recommendations: getSkinQuizRecommendations(finalAnswers),
      },
      STORAGE_KEYS.skinQuizResult,
    ).then(() => router.replace('/skin-quiz/results' as never));
  }

  function toggleMulti(value: SkinActive) {
    if (value === 'none') {
      setSelectedMulti(['none']);
      return;
    }
    setSelectedMulti((current) => {
      const withoutNone = current.filter((item) => item !== 'none');
      if (withoutNone.includes(value)) {
        return withoutNone.filter((item) => item !== value);
      }
      return [...withoutNone, value];
    });
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.shell}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => (step === 1 ? router.replace('/skin-quiz' as never) : router.back())}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="arrow-back" size={18} />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={18} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>STEP {step} OF {TOTAL_STEPS}</Text>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {config.type === 'scale' ? (
            <View style={styles.scaleWrap}>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setStressLevel(value as 1 | 2 | 3 | 4 | 5)}
                    style={({ pressed }) => [
                      styles.scalePill,
                      stressLevel === value && styles.scalePillSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.scaleText, stressLevel === value && styles.scaleTextSelected]}>
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.scaleHint}>Current: {stressLevel} / 5</Text>
            </View>
          ) : (
            <View>
              {config.options?.map((option) => {
                const selected = config.multiSelect
                  ? selectedMulti.includes(option.value as SkinActive)
                  : selectedValue === option.value;
                return (
                  <QuizOption
                    isSelected={selected}
                    key={option.value}
                    label={option.label}
                    multiSelect={config.multiSelect}
                    onPress={() => {
                      if (config.multiSelect) {
                        toggleMulti(option.value as SkinActive);
                      } else {
                        setSelectedValue(option.value as SingleStepValue);
                      }
                    }}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          disabled={!canContinue}
          onPress={saveAndGoForward}
          style={({ pressed }) => [
            styles.primaryButton,
            !canContinue && styles.buttonDisabled,
            pressed && canContinue && styles.pressed,
          ]}>
          <Text style={styles.primaryText}>{step === TOTAL_STEPS ? 'See results' : 'Continue'}</Text>
          <Ionicons color={colors.accentInk} name="arrow-forward" size={16} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  shell: { flex: 1, paddingBottom: 16, paddingHorizontal: rhythm.screenX, paddingTop: rhythm.screenTop },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 18 },
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
  progressTrack: { backgroundColor: colors.backgroundAlt, borderRadius: 999, flex: 1, height: 4, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.accent, borderRadius: 999, height: 4 },
  content: { flexGrow: 1, paddingBottom: 20, paddingTop: 6 },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 12 },
  title: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 36, lineHeight: 40, marginBottom: 12 },
  subtitle: { ...t.bodySmall, color: colors.textMuted, lineHeight: 22, marginBottom: 20 },
  scaleWrap: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  scaleRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  scalePill: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  scalePillSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  scaleText: { ...t.label, color: colors.text },
  scaleTextSelected: { color: colors.accentInk },
  scaleHint: { ...t.bodySmall, color: colors.textDim, marginTop: 12, textAlign: 'center' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryText: { ...t.label, color: colors.accentInk, fontSize: 15 },
  buttonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.86 },
});
