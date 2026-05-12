import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { PRIVACY_POLICY_URL } from '@/lib/constants/links';
import { rhythm } from '@/lib/constants/layout';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { fonts, type as t } from '@/lib/constants/typography';
import { usePro } from '@/lib/hooks/usePro';
import { storage } from '@/lib/utils/storage';
import { parseJsonValue } from '@/lib/utils/storageJson';

interface StoredSkinQuizResult {
  completedAt: string;
}

export default function SkinQuizIntroScreen() {
  const { hasEntitlement, isPro, isReady: proReady, showPaywall } = usePro();
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const hasSkinQuizUnlock = isPro || hasEntitlement('skin_quiz_unlock');

  useEffect(() => {
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
        setHasResult(Boolean(parsed?.completedAt));
      })
      .catch(() => {
        if (active) setHasResult(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleStart() {
    if (!hasSkinQuizUnlock) {
      setCheckingAccess(true);
      const result = await showPaywall('skin_quiz_unlock');
      setCheckingAccess(false);
      if (!result.didUnlock) {
        return;
      }
    }
    router.push('/skin-quiz/1' as never);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="arrow-back" size={18} />
          </Pressable>
          <Text style={styles.kicker}>SKIN QUIZ</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={18} />
          </Pressable>
        </View>

        <Text style={styles.title}>Get your personalized skin protocol</Text>
        <Text style={styles.subtitle}>
          One-time questionnaire on stress, sun exposure, acne, redness, and oiliness to match legal cosmetic peptides.
        </Text>

        <View style={styles.listCard}>
          <Row label="7 focused questions" />
          <Row label="One-time paid analysis" />
          <Row label="Rule-based recommendations (no AI required)" />
          <Row label="Cosmetic-grade peptide suggestions only" />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!proReady || checkingAccess}
          onPress={handleStart}
          style={({ pressed }) => [
            styles.primaryButton,
            (!proReady || checkingAccess) && styles.buttonDisabled,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.primaryText}>
            {checkingAccess ? 'Opening paywall...' : hasSkinQuizUnlock ? 'Start skin quiz' : 'Unlock skin quiz'}
          </Text>
        </Pressable>

        {hasResult ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/skin-quiz/results' as never)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>View latest skin quiz result</Text>
          </Pressable>
        ) : null}

        <Text style={styles.disclaimer}>
          GlowPep recommends cosmetic-grade peptides only. This is not medical advice. See our{' '}
          <Text onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} style={styles.link}>
            Privacy Policy
          </Text>{' '}
          for how your answers are used.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <Ionicons color={colors.accent} name="checkmark" size={16} />
      <Text style={styles.rowText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: 120,
    paddingHorizontal: rhythm.screenX,
    paddingTop: rhythm.screenTop,
  },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
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
  kicker: { ...t.eyebrow, color: colors.textMuted },
  title: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 40,
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: { ...t.body, color: colors.textMuted, lineHeight: 24 },
  listCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    padding: 16,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10, marginVertical: 7 },
  rowText: { ...t.bodySmall, color: colors.text },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primaryText: { ...t.label, color: colors.accentInk, fontSize: 15 },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  secondaryText: { ...t.label, color: colors.text, fontSize: 14 },
  disclaimer: {
    ...t.bodySmall,
    color: colors.textDim,
    lineHeight: 20,
    marginTop: 18,
  },
  link: { color: colors.accent, textDecorationLine: 'underline' },
  buttonDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.86 },
});
