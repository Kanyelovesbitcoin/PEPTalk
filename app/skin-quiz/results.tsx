import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { PRIVACY_POLICY_URL } from '@/lib/constants/links';
import { rhythm } from '@/lib/constants/layout';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { fonts, type as t } from '@/lib/constants/typography';
import {
  getCosmeticCompoundById,
  getSkinQuizRecommendations,
  type SkinQuizAnswers,
} from '@/lib/data/skinQuizRecommendations';
import { storage } from '@/lib/utils/storage';
import { parseJsonValue, setJsonItem } from '@/lib/utils/storageJson';

interface SkinQuizResultRecord {
  answers: SkinQuizAnswers;
  completedAt: string;
  recommendations: Array<{ compoundId: string; rationale: string }>;
}

export default function SkinQuizResultsScreen() {
  const [record, setRecord] = useState<SkinQuizResultRecord | null>(null);

  useEffect(() => {
    let active = true;
    storage
      .getItem(STORAGE_KEYS.skinQuizResult)
      .then((stored) => {
        if (!active) return;
        const parsed = parseJsonValue<Partial<SkinQuizResultRecord> | null>(
          stored,
          null,
          STORAGE_KEYS.skinQuizResult,
        );
        if (!parsed?.answers) {
          setRecord(null);
          return;
        }

        const recommendations = getSkinQuizRecommendations(parsed.answers);
        const completedAt = parsed.completedAt ?? new Date().toISOString();
        const nextRecord: SkinQuizResultRecord = {
          answers: parsed.answers,
          completedAt,
          recommendations,
        };
        setRecord(nextRecord);
        void setJsonItem(STORAGE_KEYS.skinQuizResult, nextRecord, STORAGE_KEYS.skinQuizResult);
      })
      .catch(() => {
        if (active) setRecord(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const completedDate = useMemo(() => {
    if (!record?.completedAt) return null;
    return new Date(record.completedAt).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [record?.completedAt]);

  if (!record) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>No skin quiz result yet</Text>
          <Text style={styles.subtitle}>Finish the one-time quiz first to unlock your cosmetic recommendations.</Text>
          <Pressable onPress={() => router.replace('/skin-quiz' as never)} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Start skin quiz</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
          <Text style={styles.kicker}>SKIN QUIZ RESULT</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={18} />
          </Pressable>
        </View>

        <Text style={styles.title}>Your personalized skin protocol</Text>
        <Text style={styles.subtitle}>
          {completedDate ? `Completed ${completedDate}.` : 'Completed recently.'} These are educational cosmetic matches only.
        </Text>

        {record.recommendations.map((recommendation) => {
          const compound = getCosmeticCompoundById(recommendation.compoundId);
          if (!compound) return null;
          return (
            <View key={recommendation.compoundId} style={styles.card}>
              <Text style={styles.cardName}>{compound.name}</Text>
              <Text style={styles.cardMeta}>Legal status: cosmetic</Text>
              <Text style={styles.cardReason}>{recommendation.rationale}</Text>
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          GlowPep recommends cosmetic-grade peptides only. This is not medical advice. See our{' '}
          <Text onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)} style={styles.link}>
            Privacy Policy
          </Text>{' '}
          for how your answers are used.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Back to home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { paddingBottom: 120, paddingHorizontal: rhythm.screenX, paddingTop: rhythm.screenTop },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: rhythm.screenX },
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
  title: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 38, lineHeight: 42, marginBottom: 10 },
  subtitle: { ...t.bodySmall, color: colors.textMuted, lineHeight: 22, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    padding: 14,
  },
  cardName: { ...t.label, color: colors.text, fontSize: 17, marginBottom: 4 },
  cardMeta: { ...t.dataSmall, color: colors.accent, marginBottom: 8 },
  cardReason: { ...t.bodySmall, color: colors.textMuted, lineHeight: 20 },
  disclaimer: { ...t.bodySmall, color: colors.textDim, lineHeight: 20, marginTop: 10 },
  link: { color: colors.accent, textDecorationLine: 'underline' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  primaryText: { ...t.label, color: colors.accentInk, fontSize: 15 },
  pressed: { opacity: 0.86 },
});
