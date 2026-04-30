import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { LockedSection } from '@/components/LockedSection';
import { RoutineSetupSheet } from '@/components/tracker/RoutineSetupSheet';
import { Collapsible } from '@/components/ui/Collapsible';
import { EmptyState } from '@/components/ui/EmptyState';
import { LegalStatusBadge } from '@/components/ui/LegalStatusBadge';
import { ResearchDot } from '@/components/ui/ResearchDot';
import { colors } from '@/lib/constants/colors';
import { goalById } from '@/lib/constants/goals';
import { compoundById } from '@/lib/data/compounds';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { usePro } from '@/lib/hooks/usePro';
import { useTracker } from '@/lib/hooks/useTracker';
import { fonts, type as t } from '@/lib/constants/typography';

function formatLabel(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function CompoundDetailScreen() {
  const params = useLocalSearchParams<{ compoundId: string }>();
  const compound = compoundById[params.compoundId];
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isPro, showPaywall } = usePro();
  const { isReady, schedules } = useTracker();
  const [setupOpen, setSetupOpen] = useState(false);

  if (!compound) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.missingWrap}>
          <EmptyState
            copy="This link does not match anything in the local compound library."
            icon="alert-circle-outline"
            kicker="Not found"
            secondary={{ label: 'Go back', onPress: () => router.back() }}
            title="Compound not found"
            tone="warning"
          />
        </View>
      </SafeAreaView>
    );
  }

  const saved = isFavorite(compound.id);
  const tracked = schedules.some((schedule) => schedule.active && schedule.compoundId === compound.id);

  function trackCompound() {
    if (tracked) {
      router.push('/(tabs)/tracker');
      return;
    }

    if (isReady) {
      setSetupOpen(true);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="chevron-back" size={16} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          {isPro ? (
            <Pressable
              hitSlop={10}
              onPress={() => toggleFavorite(compound.id)}
              style={({ pressed }) => [styles.favoriteButton, saved && styles.favoriteButtonOn, pressed && styles.pressed]}>
              <Ionicons
                color={saved ? colors.accent : colors.textMuted}
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={16}
              />
              <Text style={[styles.favoriteText, saved && styles.favoriteTextOn]}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              hitSlop={10}
              onPress={showPaywall}
              style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}>
              <Ionicons color={colors.textMuted} name="lock-closed-outline" size={14} />
            </Pressable>
          )}
        </View>

        <View style={styles.hero}>
          <View style={styles.classPill}>
            <View style={styles.classDot} />
            <Text style={styles.kicker}>{compound.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{compound.name}</Text>
          {compound.nickname ? <Text style={styles.nickname}>{compound.nickname}</Text> : null}

          <View style={styles.heroMeta}>
            <View style={styles.heroMetaCell}>
              <Text style={styles.heroMetaKey}>STATUS</Text>
              <View style={styles.heroBadgeRow}>
                <LegalStatusBadge status={compound.legalStatus} compact />
              </View>
            </View>
            <View style={[styles.heroMetaCell, styles.heroMetaCellBordered]}>
              <Text style={styles.heroMetaKey}>DIFFICULTY</Text>
              <Text style={styles.heroMetaVal}>{formatLabel(compound.difficulty)}</Text>
            </View>
            <View style={[styles.heroMetaCell, styles.heroMetaCellBordered]}>
              <Text style={styles.heroMetaKey}>EVIDENCE</Text>
              <View style={styles.heroBadgeRow}>
                <ResearchDot status={compound.researchStatus} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.trackPanel}>
          <View style={styles.trackPanelCopy}>
            <Text style={styles.trackPanelTitle}>{tracked ? 'Already in your routine' : 'Add to your routine?'}</Text>
            <Text style={styles.trackPanelText}>
              {tracked
                ? 'This peptide is in your routine. Open Log when you want to record use.'
                : 'Add the amount, route, and time now so daily logging is one tap.'}
            </Text>
          </View>
          <Pressable
            disabled={!isReady}
            onPress={trackCompound}
            style={({ pressed }) => [styles.trackPanelButton, tracked && styles.trackPanelButtonOn, !isReady && styles.disabled, pressed && styles.pressed]}>
            <Text style={[styles.trackPanelButtonText, tracked && styles.trackPanelButtonTextOn]}>{tracked ? 'Open Log' : 'Add to my routine'}</Text>
          </Pressable>
        </View>

        {isPro ? (          <Pressable onPress={() => router.push('/quiz')} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Text style={styles.ctaKicker}>§ — YOUR QUIZ</Text>
            <Text style={styles.ctaTitle}>Want personalized recommendations?</Text>
            <Text style={styles.ctaCopy}>Take the GlowPep quiz and see which compounds rise to the top for your goals.</Text>
            <View style={styles.ctaFooter}>
              <Text style={styles.ctaCta}>Begin</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
      <RoutineSetupSheet
        compound={compound}
        onClose={() => setSetupOpen(false)}
        visible={setupOpen}
      />
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
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    ...t.label,
    color: colors.text,
    fontSize: 13,
  },
  favoriteButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  favoriteButtonOn: {
    borderColor: `${colors.accent}66`,
  },
  favoriteText: {
    ...t.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  favoriteTextOn: {
    color: colors.accent,
  },
  hero: {
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
    padding: 20,
  },
  classPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  classDot: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  kicker: {
    ...t.eyebrow,
    color: colors.accent,
  },
  name: {
    fontFamily: fonts.sansMedium,
    color: colors.text,
    fontSize: 34,
    letterSpacing: -0.85,
    lineHeight: 40,
    marginBottom: 4,
  },
  nickname: {
    ...t.bodySmall,
    color: colors.textMuted,
    fontStyle: 'normal',
  },
  heroMeta: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    flexDirection: 'row',
    marginTop: 18,
    padding: 14,
  },
  heroMetaCell: {
    flex: 1,
  },
  heroMetaCellBordered: {
    borderLeftColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: 12,
  },
  heroMetaKey: {
    ...t.dataSmall,
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroMetaVal: {
    ...t.data,
    color: colors.text,
  },
  heroBadgeRow: {
    flexDirection: 'row',
  },
  trackPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
    padding: 16,
  },
  trackPanelCopy: {
    marginBottom: 14,
  },
  trackPanelTitle: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    marginBottom: 6,
  },
  trackPanelText: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  trackPanelButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  trackPanelButtonOn: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trackPanelButtonText: {
    color: colors.accentInk,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  trackPanelButtonTextOn: {
    color: colors.accent,
  },
  disabled: {
    opacity: 0.48,
  },
  sections: {
    marginBottom: 18,
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    padding: 18,
  },
  sectionTitle: {
    ...t.label,
    color: colors.text,
    fontSize: 15,
    marginBottom: 10,
  },
  freeSection: {
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    padding: 18,
  },
  freeHead: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  freeNum: {
    ...t.sectionNum,
    color: colors.textFaint,
    fontSize: 10,
  },
  freeTitle: {
    ...t.label,
    color: colors.text,
    flex: 1,
    fontSize: 15,
  },
  copy: {
    ...t.body,
    color: colors.textMuted,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  bulletMark: {
    backgroundColor: colors.accent,
    borderRadius: 1,
    height: 6,
    marginTop: 9,
    width: 6,
  },
  bulletMarkAmber: {
    backgroundColor: colors.amber,
  },
  bulletMarkLocked: {
    backgroundColor: colors.textFaint,
  },
  bulletText: {
    ...t.body,
    color: colors.textMuted,
    flex: 1,
  },
  teaseList: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  teaseRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 9,
  },
  teaseText: {
    ...t.bodySmall,
    color: colors.textMuted,
    flex: 1,
  },
  teaseMore: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  teaseMoreText: {
    ...t.dataSmall,
    color: colors.accent,
  },
  lockedPreview: {
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: 'hidden',
    padding: 18,
  },
  lockedHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  lockedTitle: {
    ...t.label,
    color: colors.text,
    fontSize: 15,
    marginBottom: 8,
  },
  lockedTeaseCopy: {
    ...t.bodySmall,
    color: colors.textDim,
  },
  lockedFade: {
    backgroundColor: 'rgba(19, 26, 23, 0.72)',
    bottom: 0,
    height: 28,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  tagBlock: {
    marginBottom: 18,
  },
  tagBlockTitle: {
    ...t.eyebrow,
    color: colors.textFaint,
    marginBottom: 12,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalTag: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goalTagDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  goalTagText: {
    ...t.label,
    color: colors.text,
    fontSize: 12,
  },
  cta: {
    backgroundColor: colors.surfaceAlt,
    borderColor: `${colors.accent}33`,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    padding: 22,
  },
  ctaKicker: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 10,
  },
  ctaTitle: {
    ...t.displaySmall,
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 8,
  },
  ctaCopy: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginBottom: 16,
  },
  ctaFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  ctaCta: {
    ...t.label,
    color: colors.accent,
    fontSize: 13,
  },
  ctaArrow: {
    color: colors.accent,
    fontSize: 14,
  },
  missingWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  missingTitle: {
    ...t.display,
    color: colors.text,
    fontSize: 26,
    marginBottom: 10,
    marginTop: 18,
  },
  missingCopy: {
    ...t.body,
    color: colors.textMuted,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  upgradeButtonText: {
    ...t.label,
    color: colors.accentInk,
    fontSize: 15,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
