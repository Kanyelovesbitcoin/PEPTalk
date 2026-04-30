import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import { RoutineSetupSheet } from '@/components/tracker/RoutineSetupSheet';
import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';
import { goalById } from '@/lib/constants/goals';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { useTracker } from '@/lib/hooks/useTracker';

export default function StackScreen() {
  const { savedStacks, resetQuiz } = useQuiz();
  const { isReady, schedules } = useTracker();
  const [setupCompoundId, setSetupCompoundId] = useState<string | null>(null);
  const latestStack = savedStacks[0] ?? null;
  const setupCompound = setupCompoundId ? compoundById[setupCompoundId] ?? null : null;

  const items = useMemo(() => {
    if (!latestStack) return [];
    return latestStack.compounds.slice(0, 4).map((entry, i) => {
      const compound = compoundById[entry.compoundId];
      const tracked = schedules.some((schedule) => schedule.active && schedule.compoundId === entry.compoundId);
      return {
        id: entry.compoundId,
        n: String(i + 1).padStart(2, '0'),
        name: compound?.name ?? 'Peptide',
        sub: compound?.summary ?? '',
        tier: entry.tier,
        reasoning: entry.reasoning,
        goal: compound?.goals[0] ? goalById[compound.goals[0]].title : 'Tracking',
        tracked,
      };
    });
  }, [latestStack, schedules]);

  const primaryGoalTitle = latestStack
    ? goalById[latestStack.quizAnswers.primaryGoal].title.toLowerCase()
    : 'looks and longevity';

  function trackCompound(compoundId: string) {
    const compound = compoundById[compoundId];
    if (!compound || schedules.some((schedule) => schedule.active && schedule.compoundId === compoundId)) return;

    if (isReady) {
      setSetupCompoundId(compoundId);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text style={styles.eyebrow}>
            <Text style={styles.eyebrowDot}>● </Text>
            {latestStack ? 'RECOMMENDED FOR YOU' : 'ROUTINE BUILDER'}
          </Text>
          <Text style={styles.title}>
            Build around{`\n`}
            <Text style={styles.titleAccent}>{primaryGoalTitle}</Text>
          </Text>
          <Text style={styles.intro}>
            Answer the questionnaire for an educational shortlist. Nothing is added to your routine until you choose it.
          </Text>
        </View>
        <View style={styles.ruleBold} />

        {latestStack ? (
          <>
            <View style={styles.summaryRow}>
              <SummaryCell label="Suggestions" value={String(items.length).padStart(2, '0')} />
              <SummaryCell label="Tracking" value={String(items.filter((item) => item.tracked).length).padStart(2, '0')} />
              <SummaryCell label="Goal" value={goalById[latestStack.quizAnswers.primaryGoal].shortTitle} compact />
            </View>

            {items.map((item) => (
              <View key={item.id} style={styles.entry}>
                <View style={styles.entryHead}>
                  <Text style={styles.entryNum}>N° {item.n}</Text>
                  <Text style={styles.entryTier}>{item.tier.toUpperCase()}</Text>
                </View>
                <Text style={styles.entryName}>{item.name}</Text>
                <Text style={styles.entrySub}>{item.sub}</Text>
                <Text style={styles.reasoning}>{item.reasoning}</Text>
                <View style={styles.entryFooter}>
                  <View style={styles.goalPill}>
                    <Text style={styles.goalPillText}>{item.goal}</Text>
                  </View>
                  <Pressable
                    disabled={!isReady}
                    onPress={() => (item.tracked ? router.push('/(tabs)/tracker') : trackCompound(item.id))}
                    style={({ pressed }) => [styles.trackButton, item.tracked && styles.trackButtonOn, !isReady && styles.disabled, pressed && styles.pressed]}>
                    <Text style={[styles.trackButtonText, item.tracked && styles.trackButtonTextOn]}>
                      {item.tracked ? 'In your routine' : 'Add to my routine'}
                    </Text>
                    <Ionicons color={item.tracked ? colors.accent : colors.accentInk} name={item.tracked ? 'checkmark' : 'add'} size={15} />
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={styles.ctaBlock}>
              <Pressable
                onPress={() => {
                  resetQuiz();
                  router.push('/quiz');
                }}
                style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Retake questionnaire</Text>
                <Text style={styles.btnGhostArrow}>↻</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Find your starting point.</Text>
            <Text style={styles.emptyCopy}>
              The questionnaire ranks peptides for your looks, recovery, focus, and longevity goals. You decide what goes into your routine.
            </Text>
            <Pressable
              onPress={() => {
                resetQuiz();
                router.push('/quiz');
              }}
              style={styles.btn}>
              <Text style={styles.btnText}>Start questionnaire</Text>
              <Text style={styles.btnArrow}>→</Text>
            </Pressable>
            <Text style={styles.emptyFoot}>EDUCATIONAL · COSMETIC TRACKING · NOT MEDICAL ADVICE</Text>
          </View>
        )}
      </ScrollView>
      <RoutineSetupSheet
        compound={setupCompound}
        onClose={() => setSetupCompoundId(null)}
        visible={Boolean(setupCompound)}
      />
    </SafeAreaView>
  );
}

function SummaryCell({ compact, label, value }: { compact?: boolean; label: string; value: string }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, compact && styles.summaryValueCompact]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  scroll: { paddingBottom: 150 },
  head: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 22 },
  eyebrow: { ...t.eyebrow, color: colors.textDim },
  eyebrowDot: { color: colors.accent },
  title: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 39, lineHeight: 42, letterSpacing: -1.4, marginTop: 8 },
  titleAccent: { color: colors.accent },
  intro: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, marginTop: 14, maxWidth: 330 },
  ruleBold: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  summaryRow: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginHorizontal: 22, marginTop: 18, overflow: 'hidden' },
  summaryCell: { flex: 1, paddingHorizontal: 14, paddingVertical: 18 },
  summaryLabel: { ...t.eyebrow, color: colors.textDim, fontSize: 9, marginBottom: 8 },
  summaryValue: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 30, letterSpacing: -1, lineHeight: 32 },
  summaryValueCompact: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 16, letterSpacing: -0.2, lineHeight: 22, paddingTop: 6 },
  entry: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, marginHorizontal: 22, marginTop: 14, paddingHorizontal: 18, paddingVertical: 20 },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  entryNum: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.6 },
  entryTier: { color: colors.accent, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1 },
  entryName: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 28, letterSpacing: -1, lineHeight: 30, marginBottom: 6 },
  entrySub: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, marginBottom: 14 },
  reasoning: { backgroundColor: colors.backgroundAlt, borderRadius: 14, color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, marginBottom: 18, padding: 14 },
  entryFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  goalPill: { borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 8 },
  goalPillText: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  trackButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 999, flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: 14 },
  trackButtonOn: { backgroundColor: 'transparent', borderColor: colors.borderStrong, borderWidth: StyleSheet.hairlineWidth },
  trackButtonText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 13 },
  trackButtonTextOn: { color: colors.accent },
  ctaBlock: { paddingHorizontal: 22, paddingTop: 24 },
  btn: { height: 58, backgroundColor: colors.accent, borderRadius: 16, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 14 },
  btnArrow: { color: colors.accentInk, fontFamily: fonts.mono, fontSize: 14 },
  btnGhost: { backgroundColor: 'transparent', borderColor: colors.borderStrong, borderWidth: StyleSheet.hairlineWidth },
  btnGhostText: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 14 },
  btnGhostArrow: { color: colors.text, fontFamily: fonts.mono, fontSize: 14 },
  emptyBlock: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginHorizontal: 22, marginTop: 28, padding: 22 },
  emptyTitle: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 30, letterSpacing: -0.8, marginBottom: 12 },
  emptyCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, marginBottom: 24 },
  emptyFoot: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.3, lineHeight: 15, textAlign: 'center', marginTop: 18 },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.84 },
});
