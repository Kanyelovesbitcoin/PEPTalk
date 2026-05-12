import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrialAccessState } from '@/components/TrialAccessState';
import { colors } from '@/lib/constants/colors';
import { rhythm } from '@/lib/constants/layout';
import { fonts, type as t } from '@/lib/constants/typography';
import { usePro } from '@/lib/hooks/usePro';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { setFreeModeNotice } from '@/lib/utils/freeModeNotice';
import { showPaywallWithTimeout } from '@/lib/utils/paywallTimeout';

export default function QuizIntroScreen() {
  const { isPro, isReady: proReady, showPaywall } = usePro();
  const { resetQuiz, savedStacks } = useQuiz();
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

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
        await setFreeModeNotice('The deep guide is a Pro feature. Free mode is still ready with Library, Today\'s Rotation, and local logs.');
      }
      router.replace(result.didUnlock ? '/quiz/1' : '/(tabs)');
    });

    return () => {
      active = false;
    };
  }, [accessError, checkingAccess, isPro, proReady, showPaywall]);

  if (!proReady || checkingAccess || accessError || !isPro) {
    return (
      <TrialAccessState
        error={accessError}
        onContinue={() => router.replace('/(tabs)')}
        onRetry={() => {
          setAccessError(null);
          setCheckingAccess(false);
        }}
        title="Opening trial access"
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="arrow-back" size={18} />
          </Pressable>
          <Text style={styles.progress}>PRO GLOWMAX GUIDE</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)/ai')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={18} />
          </Pressable>
        </View>

        <View style={styles.heroMark}>
          <Ionicons color={colors.accent} name="flask" size={30} />
        </View>
        <Text style={styles.kicker}>DEEP GLOWMAX ORGANIZATION</Text>
        <Text style={styles.title}>Build a saved list around your baseline.</Text>
        <Text style={styles.subtitle}>
          Ten focused screens turn your goal, comfort level, routine context, and research interests into a private list of saved items.
        </Text>

        <View style={styles.promisePanel}>
          <PromiseRow label="Signal-first educational ranking" />
          <PromiseRow label="Cosmetic and legal context stays visible" />
          <PromiseRow label="Saved items, tracking notes, and regenerated context" />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            resetQuiz();
            router.push('/quiz/1');
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>Start Glowmax guide</Text>
          <Ionicons color={colors.accentInk} name="arrow-forward" size={18} />
        </Pressable>

        {savedStacks[0] ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/quiz/results',
                params: { stackId: savedStacks[0].id },
              })
            }
            style={({ pressed }) => [styles.secondaryCard, pressed && styles.pressed]}>
            <Text style={styles.secondaryTitle}>Open saved items</Text>
            <Text style={styles.secondaryCopy}>Jump straight back into the last result you saved on this device.</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PromiseRow({ label }: { label: string }) {
  return (
    <View style={styles.promiseRow}>
      <Ionicons color={colors.accent} name="checkmark" size={16} />
      <Text style={styles.promiseText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 130,
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
    justifyContent: 'space-between',
    marginBottom: 34,
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
  progress: { ...t.eyebrow, color: colors.textMuted, letterSpacing: 1.3 },
  heroMark: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 70,
    justifyContent: 'center',
    marginBottom: 24,
    width: 70,
  },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 14 },
  title: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 40,
    letterSpacing: -0.8,
    lineHeight: 43,
    marginBottom: 16,
    maxWidth: 340,
  },
  subtitle: { ...t.body, color: colors.textMuted, lineHeight: 24, maxWidth: 342 },
  promisePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
    marginTop: 28,
    padding: 16,
  },
  promiseRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  promiseText: { ...t.bodySmall, color: colors.text, flex: 1 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonText: { ...t.label, color: colors.accentInk, fontSize: 15 },
  secondaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    padding: 16,
  },
  secondaryTitle: { ...t.label, color: colors.text, marginBottom: 6 },
  secondaryCopy: { ...t.bodySmall, color: colors.textMuted },
  pressed: { opacity: 0.86 },
});
