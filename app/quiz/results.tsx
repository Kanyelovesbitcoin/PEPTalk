import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AiPrivacyNotice } from '@/components/privacy/AiPrivacyNotice';
import { StackResultCard } from '@/components/StackResultCard';
import { TrialAccessState } from '@/components/TrialAccessState';
import { colors } from '@/lib/constants/colors';
import { FREE_LIMITS } from '@/lib/constants/features';
import { goals } from '@/lib/constants/goals';
import { compoundById } from '@/lib/data/compounds';
import { useAiPreview } from '@/lib/hooks/useAiPreview';
import { usePro } from '@/lib/hooks/usePro';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { setFreeModeNotice } from '@/lib/utils/freeModeNotice';
import { hapticLight } from '@/lib/utils/haptics';
import { fetchAiInsights, isAiConfigured, regenerateInsights } from '@/lib/utils/aiInsights';
import { showPaywallWithAlert } from '@/lib/utils/paywallAlerts';
import { showPaywallWithTimeout } from '@/lib/utils/paywallTimeout';
import type { CompoundInsight, QuizAnswers, StackResult } from '@/types/quiz';

const SAVE_SUCCESS_DELAY_MS = 650;

// Map quiz keys to human-readable labels for the "adjust" sheet
const ADJUSTABLE_KEYS: Array<{ key: keyof QuizAnswers; label: string }> = [
  { key: 'primaryGoal', label: 'Primary Goal' },
  { key: 'budget', label: 'Research Breadth' },
  { key: 'injectionComfort', label: 'Injection Comfort' },
  { key: 'experienceLevel', label: 'Experience Level' },
  { key: 'skinTexture', label: 'Skin Smoothness' },
  { key: 'resultPreference', label: 'Result Style' },
];

function formatAnswerValue(key: keyof QuizAnswers, value: unknown): string {
  if (key === 'primaryGoal') {
    const goal = goals.find((g) => g.id === value);
    return goal?.shortTitle ?? String(value);
  }
  if (key === 'budget') {
    const labels: Record<string, string> = {
      'under-50': 'Very focused',
      '50-100': 'Focused plus',
      '100-200': 'Broader context',
      unlimited: 'Full landscape',
    };
    return labels[String(value)] ?? String(value);
  }
  if (Array.isArray(value)) return value.join(', ');
  return String(value)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function QuizResultsScreen() {
  const params = useLocalSearchParams<{ stackId?: string }>();
  const { isPro, isReady: proReady, showPaywall } = usePro();
  const {
    acceptAiPrivacy,
    aiPrivacyAccepted,
    consumeFreeAiStack,
    freeAiStackUsed,
    isReady: aiPreviewReady,
  } = useAiPreview();
  const {
    currentResult,
    generateResult,
    getSavedStack,
    isComplete,
    quizAnswers,
    resetQuiz,
    saveStack,
    savedStacks,
    updateAnswer,
  } = useQuiz();

  const [stack, setStack] = useState<StackResult | null>(null);
  const [aiInsights, setAiInsights] = useState<CompoundInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showAiPrivacy, setShowAiPrivacy] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [privacyPrompted, setPrivacyPrompted] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedStack = params.stackId ? getSavedStack(params.stackId) : undefined;
  const alreadySaved = stack ? savedStacks.some((item) => item.id === stack.id) : false;
  const saveComplete = alreadySaved || saveState === 'saved';

  useEffect(() => () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
  }, []);

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
        await setFreeModeNotice('Saved results are a Pro feature. Free mode is ready with Library, Today\'s Rotation, and local logs.');
      }
      router.replace(result.didUnlock ? '/quiz/results' : '/(tabs)');
    });

    return () => {
      active = false;
    };
  }, [accessError, checkingAccess, isPro, proReady, showPaywall]);

  // Load or generate the saved result.
  useEffect(() => {
    if (savedStack) {
      setStack(savedStack);
      setSaveState('idle');
      return;
    }
    if (currentResult) {
      setStack(currentResult);
      setSaveState('idle');
      return;
    }
    if (isComplete) {
      setStack(generateResult());
      setSaveState('idle');
      return;
    }
    setStack(null);
    setSaveState('idle');
  }, [currentResult, generateResult, isComplete, savedStack]);

  // ─── Fetch AI insights ───
  useEffect(() => {
    const canUseAi = isPro || !freeAiStackUsed;
    if (!stack || !aiPreviewReady || !canUseAi) return;

    if (stack.aiInsights && stack.aiInsights.length > 0) {
      setAiInsights(stack.aiInsights);
      return;
    }

    // No API key configured — skip the call entirely so the loading state
    // never gets stuck. The rule-based reasoning is always visible below.
    if (!isAiConfigured()) {
      setInsightsLoading(false);
      return;
    }

    if (!aiPrivacyAccepted) {
      if (!privacyPrompted) {
        setShowAiPrivacy(true);
        setPrivacyPrompted(true);
      }
      return;
    }

    let cancelled = false;
    setInsightsLoading(true);

    fetchAiInsights(stack.quizAnswers, stack.compounds)
      .then((insights) => {
        if (!cancelled) {
          setAiInsights(insights);
          stack.aiInsights = insights;
          if (!isPro && !freeAiStackUsed) {
            consumeFreeAiStack();
          }
        }
      })
      .catch(() => {
        // Fail silently — rule-based reasoning is always visible
      })
      .finally(() => {
        if (!cancelled) setInsightsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [aiPreviewReady, aiPrivacyAccepted, consumeFreeAiStack, freeAiStackUsed, isPro, privacyPrompted, stack]);

  // ─── Regenerate handler ───
  async function handleRegenerate() {
    if (!stack) return;
    if (!isPro) {
      await showPaywallWithAlert(showPaywall);
      return;
    }
    if (!aiPrivacyAccepted) {
      setShowAiPrivacy(true);
      return;
    }
    setRegenerating(true);
    try {
      const freshInsights = await regenerateInsights(
        stack.quizAnswers,
        stack.compounds,
        aiInsights,
      );
      setAiInsights(freshInsights);
      stack.aiInsights = freshInsights;
    } catch {
      Alert.alert('Oops', 'Could not regenerate insights. Try again in a moment.');
    } finally {
      setRegenerating(false);
    }
  }

  // ─── Adjust one answer and re-run ───
  function handleAdjustAnswer(key: keyof QuizAnswers) {
    // Navigate back to the specific quiz step to change that answer
    const stepIndex = [
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
    ].indexOf(key);

    if (stepIndex >= 0) {
      setShowAdjust(false);
      router.push(`/quiz/${stepIndex + 1}`);
    }
  }

  async function handleSaveStack() {
    if (!stack || saveState !== 'idle') return;
    if (!isPro && !alreadySaved && savedStacks.length >= FREE_LIMITS.savedStacks) {
      await showPaywallWithAlert(showPaywall);
      return;
    }

    setSaveState('saving');
    saveStack(stack);
    hapticLight();
    setSaveState('saved');

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      router.replace('/(tabs)');
    }, SAVE_SUCCESS_DELAY_MS);
  }

  if (!proReady || checkingAccess || accessError || !isPro) {
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

  // ─── Empty state ───
  if (!stack) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>Nothing saved yet</Text>
          <Text style={styles.subtitle}>
            Start the guide to build your first saved items.
          </Text>
          <Pressable
            onPress={() => router.replace('/quiz')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Go to guide</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/(tabs)/ai')}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={20} />
          </Pressable>
        </View>

        <Text style={styles.kicker}>Your Saved Items</Text>
        <Text style={styles.title}>Your saved items, organized.</Text>
        <Text style={styles.subtitle}>
          Goal-matching from your guide answers. Pro builds the longer Glowmax record with AI-assisted organization,
          private reminders, exports, and progress comparisons. This is not product, amount, or use guidance.
        </Text>

        {/* ─── Compound Cards ─── */}
        {stack.compounds.map((match) => {
          const compound = compoundById[match.compoundId];
          if (!compound) return null;

          const insight = aiInsights.find((i) => i.compoundId === match.compoundId);

          return (
            <StackResultCard
              allMatches={stack.compounds}
              compound={compound}
              insight={insight}
              insightsLoading={insightsLoading}
              key={match.compoundId}
              match={match}
              onPress={() =>
                router.push({
                  pathname: '/compound/[compoundId]',
                  params: { compoundId: compound.id },
                })
              }
              quizAnswers={stack.quizAnswers}
            />
          );
        })}

        {/* ─── Follow-Up Actions ─── */}
        <View style={styles.followUpSection}>
          <Text style={styles.followUpTitle}>What next?</Text>

          {/* Regenerate */}
          <Pressable
            disabled={regenerating || insightsLoading}
            onPress={handleRegenerate}
            style={({ pressed }) => [
              styles.followUpButton,
              (regenerating || insightsLoading) && styles.followUpButtonDisabled,
              pressed && styles.pressed,
            ]}>
            {regenerating ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Ionicons color={colors.accent} name="refresh-outline" size={20} />
            )}
            <View style={styles.followUpTextWrap}>
              <Text style={styles.followUpLabel}>Regenerate insights</Text>
              <Text style={styles.followUpDesc}>{isPro ? 'Get fresh educational reasoning with a different research angle' : 'Pro unlocks more AI-assisted organization'}</Text>
            </View>
          </Pressable>

          {/* Adjust an answer */}
          <Pressable
            onPress={() => setShowAdjust(!showAdjust)}
            style={({ pressed }) => [styles.followUpButton, pressed && styles.pressed]}>
            <Ionicons color={colors.accent} name="options-outline" size={20} />
            <View style={styles.followUpTextWrap}>
              <Text style={styles.followUpLabel}>Adjust one answer</Text>
              <Text style={styles.followUpDesc}>Tweak a single response and re-run the match</Text>
            </View>
            <Ionicons
              color={colors.textMuted}
              name={showAdjust ? 'chevron-up' : 'chevron-down'}
              size={18}
            />
          </Pressable>

          {/* Adjustable answers panel */}
          {showAdjust ? (
            <View style={styles.adjustPanel}>
              {ADJUSTABLE_KEYS.map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => handleAdjustAnswer(key)}
                  style={({ pressed }) => [styles.adjustRow, pressed && styles.pressed]}>
                  <View style={styles.adjustInfo}>
                    <Text style={styles.adjustLabel}>{label}</Text>
                    <Text style={styles.adjustValue}>
                      {formatAnswerValue(key, stack.quizAnswers[key])}
                    </Text>
                  </View>
                  <Ionicons color={colors.textMuted} name="pencil-outline" size={16} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Retake guide entirely */}
          <Pressable
            onPress={() => {
              resetQuiz();
              router.replace('/quiz/1');
            }}
            style={({ pressed }) => [styles.followUpButton, pressed && styles.pressed]}>
            <Ionicons color={colors.textMuted} name="reload-outline" size={20} />
            <View style={styles.followUpTextWrap}>
              <Text style={[styles.followUpLabel, { color: colors.textMuted }]}>Start over</Text>
              <Text style={styles.followUpDesc}>Retake the full guide from scratch</Text>
            </View>
          </Pressable>
        </View>

        {/* ─── Save ─── */}
        <Pressable
          disabled={saveComplete || saveState === 'saving'}
          onPress={handleSaveStack}
          style={({ pressed }) => [
            styles.primaryButton,
            saveComplete && styles.primaryButtonSaved,
            saveState === 'saving' && styles.primaryButtonDisabled,
            pressed && !saveComplete && saveState !== 'saving' && styles.pressed,
          ]}>
          <Text style={[styles.primaryButtonText, saveComplete && styles.primaryButtonTextSaved]}>
            {saveComplete ? 'Added' : saveState === 'saving' ? 'Saving' : alreadySaved || isPro || savedStacks.length < FREE_LIMITS.savedStacks ? 'Save' : 'Save more'}
          </Text>
          {saveComplete ? <Ionicons color={colors.accent} name="checkmark-circle" size={18} /> : null}
        </Pressable>
      </ScrollView>
      {showAiPrivacy ? (
        <AiPrivacyNotice
          onAccept={async () => {
            await acceptAiPrivacy();
            setShowAiPrivacy(false);
            setPrivacyPrompted(false);
          }}
          onCancel={() => setShowAiPrivacy(false)}
        />
      ) : null}
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
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },

  // ─── Follow-up actions ───
  followUpSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  followUpTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  followUpButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    padding: 16,
  },
  followUpButtonDisabled: {
    opacity: 0.5,
  },
  followUpTextWrap: {
    flex: 1,
  },
  followUpLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  followUpDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },

  // ─── Adjust panel ───
  adjustPanel: {
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    overflow: 'hidden',
  },
  adjustRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  adjustInfo: {
    flex: 1,
  },
  adjustLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  adjustValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },

  // ─── Save / Primary ───
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonSaved: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.accent,
    borderWidth: StyleSheet.hairlineWidth,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButtonTextSaved: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.9,
  },
});
