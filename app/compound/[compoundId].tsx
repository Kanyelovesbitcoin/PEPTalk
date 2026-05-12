import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BreadthDots } from '@/components/library/BreadthDots';
import { Chip } from '@/components/library/Chip';
import { EvidenceTile } from '@/components/library/EvidenceTile';
import { MetaRow } from '@/components/library/MetaRow';
import { RefBadge } from '@/components/library/RefBadge';
import { RoutineSetupSheet } from '@/components/tracker/RoutineSetupSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors } from '@/lib/constants/colors';
import { goalById } from '@/lib/constants/goals';
import { rhythm } from '@/lib/constants/layout';
import { fonts, type as t } from '@/lib/constants/typography';
import { compoundById, compounds } from '@/lib/data/compounds';
import { getDefaultCompoundTags } from '@/lib/data/compoundTags';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useAdaptiveLayout } from '@/lib/hooks/useAdaptiveLayout';
import { usePro } from '@/lib/hooks/usePro';
import { useTracker } from '@/lib/hooks/useTracker';
import { hapticSelection } from '@/lib/utils/haptics';
import { showPaywallWithAlert } from '@/lib/utils/paywallAlerts';
import type { Compound, EvidenceProfile } from '@/types/compound';

const ROUTE_LABEL: Record<string, string> = {
  injection: 'Non-oral',
  nasal: 'Nasal',
  oral: 'Oral',
  sublingual: 'Sublingual',
  topical: 'Topical',
};

const EVIDENCE_LABELS: Array<[keyof EvidenceProfile, string]> = [
  ['preclinical', 'Preclinical'],
  ['humanTrials', 'Human trials'],
  ['anecdotal', 'Anecdotal'],
  ['cosmetic', 'Cosmetic'],
];

function formatIndex(compound: Compound) {
  return String(compounds.findIndex((item) => item.id === compound.id) + 1).padStart(2, '0');
}

function formatRoutes(compound: Compound) {
  return compound.administrationRoutes.map((route) => ROUTE_LABEL[route] ?? route).join(' / ');
}

function todayStamp() {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(new Date());
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const year = parts.find((part) => part.type === 'year')?.value ?? '';

  return `${day} ${month} ${year}`.trim().toUpperCase();
}

function statusLabel(compound: Compound) {
  if (compound.regulatoryStatus === 'compounding-concern') return 'Compounding concern';
  if (compound.legalStatus === 'cosmetic') return 'Cosmetic - legal';
  if (compound.legalStatus === 'approved-rx') return 'Prescription-only';
  if (compound.legalStatus === 'investigational') return 'Investigational';
  return 'Research-only';
}

function humanDataLabel(evidence: EvidenceProfile) {
  if (evidence.humanTrials >= 0.7) return 'Well studied';
  if (evidence.humanTrials >= 0.36) return 'Mixed';
  return 'Limited';
}

function fallbackEvidence(compound: Compound): EvidenceProfile {
  if (compound.legalStatus === 'cosmetic') {
    return { anecdotal: 0.36, cosmetic: 0.82, humanTrials: 0.48, preclinical: 0.54 };
  }
  if (compound.researchStatus === 'well-studied') {
    return { anecdotal: 0.46, cosmetic: 0.12, humanTrials: 0.76, preclinical: 0.72 };
  }
  if (compound.researchStatus === 'promising') {
    return { anecdotal: 0.52, cosmetic: 0.08, humanTrials: 0.34, preclinical: 0.64 };
  }
  return { anecdotal: 0.38, cosmetic: 0.04, humanTrials: 0.16, preclinical: 0.48 };
}

function isCompound(value: Compound | undefined): value is Compound {
  return Boolean(value);
}

export default function CompoundDetailScreen() {
  const layout = useAdaptiveLayout();
  const params = useLocalSearchParams<{ compoundId: string }>();
  const compound = compoundById[params.compoundId];
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isPro, showPaywall } = usePro();
  const { isReady, schedules } = useTracker();
  const [setupOpen, setSetupOpen] = useState(false);

  const relatedCompounds = useMemo(() => {
    if (!compound) return [];
    return (compound.relatedCompoundIds ?? []).map((id) => compoundById[id]).filter(isCompound);
  }, [compound]);

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
  const trackerCount = schedules.filter((schedule) => schedule.active && schedule.compoundId === compound.id).length;
  const tracked = trackerCount > 0;
  const index = formatIndex(compound);
  const primaryGoal = goalById[compound.goals[0]];
  const evidence = compound.evidence ?? fallbackEvidence(compound);
  const lead = compound.whatIsIt.trim();
  const leadFirst = lead.charAt(0);
  const leadRest = lead.slice(1);
  const tags = getDefaultCompoundTags(compound);
  const pullQuote = compound.pullQuote ?? compound.thingsToKnow[0] ?? compound.evidenceNote;

  function handleFavorite() {
    hapticSelection();
    if (!isPro) {
      void showPaywallWithAlert(showPaywall);
      return;
    }
    toggleFavorite(compound.id);
  }

  async function handleShare() {
    hapticSelection();
    await Share.share({
      message: `${compound.name}: ${compound.summary}`,
      title: `GlowPep dossier: ${compound.name}`,
    });
  }

  function handleTrackerPress() {
    hapticSelection();
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: layout.readableMaxWidth,
            paddingHorizontal: layout.screenX,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topNav}>
          <Pressable
            accessibilityLabel="Back to Library"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
            <Ionicons color={colors.textDim} name="chevron-back" size={13} />
            <Text style={styles.backLinkText}>Library</Text>
          </Pressable>
          <View style={styles.actionWords}>
            <Pressable accessibilityLabel={`Share dossier for ${compound.name}`} accessibilityRole="button" hitSlop={8} onPress={handleShare}>
              <Text style={styles.actionWord}>Share</Text>
            </Pressable>
            <Text style={styles.actionDot}>/</Text>
            <Pressable
              accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${compound.name}`}
              accessibilityRole="button"
              accessibilityState={{ selected: saved }}
              hitSlop={8}
              onPress={handleFavorite}>
              <Text style={[styles.actionWord, saved && styles.actionWordOn]}>{saved ? 'Saved' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.dossierStrip}>
          <RefBadge label="Reference dossier" />
          <Text style={styles.volumeText}>VOL. {index} / {compounds.length}</Text>
        </View>

        <View style={styles.hero}>
          <Text pointerEvents="none" style={styles.heroNumber}>{index}</Text>
          <View style={styles.fileLine}>
            <Text style={styles.fileLineText}>FILE {index} / {compounds.length}</Text>
            <Text style={styles.fileDot}>/</Text>
            <Text style={styles.fileLineText}>OPENED {todayStamp()}</Text>
          </View>
          <Text style={styles.referenceLine}>
            REFERENCE No. {index} - {primaryGoal.title}
          </Text>
          <Text accessibilityRole="header" numberOfLines={3} adjustsFontSizeToFit style={styles.name}>{compound.name}</Text>
          <Text numberOfLines={2} style={styles.nickname}>{compound.nickname}</Text>
        </View>

        <View style={styles.identityTable}>
          <DossierMeta k="Common" v={compound.nickname} />
          <DossierMeta k="Class" v={compound.class ?? compound.type} />
          <DossierMeta k="Origin" v={compound.origin ?? 'Synthetic research reference'} />
        </View>

        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>

        <View style={styles.overviewSection}>
          <DossierSectionLabel marker="I" title="Overview" />
          <View style={styles.leadBlock}>
            <Text style={styles.dropCap}>{leadFirst}</Text>
            <Text style={styles.leadText}>{leadRest}</Text>
          </View>
        </View>

        <View style={styles.pullQuote}>
          <View style={styles.quoteRule} />
          <View style={styles.quoteCopy}>
            <Text style={styles.quoteText}>{pullQuote}</Text>
            <Text style={styles.quoteCaption}>- Editor's note</Text>
          </View>
        </View>

        <View style={styles.section}>
          <DossierSectionLabel marker="II" title="Research Profile" />
          <View style={styles.metaCard}>
            <MetaRow k="Status" v={statusLabel(compound)} />
            <MetaRow k="Route notes" v={formatRoutes(compound)} />
            <MetaRow k="Evidence" v={compound.evidenceLabel ?? 'Limited'} />
            <MetaRow k="Human data" v={humanDataLabel(evidence)} />
            <MetaRow k="Breadth" last v={<BreadthDots value={compound.breadth} />} />
          </View>
        </View>

        <View style={styles.section}>
          <DossierSectionLabel marker="III" title="Evidence Distribution" />
          <ScrollView contentContainerStyle={styles.evidenceRail} horizontal showsHorizontalScrollIndicator={false}>
            {EVIDENCE_LABELS.map(([key, label]) => (
              <EvidenceTile key={key} label={label} value={evidence[key]} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <DossierSectionLabel marker="IV" title="Caution Notes" />
          <View style={styles.cautionCard}>
            <View style={styles.shieldPlate}>
              <Ionicons color={colors.accent} name="shield-checkmark-outline" size={26} />
            </View>
            <View style={styles.cautionRows}>
              {compound.thingsToKnow.map((item, itemIndex) => (
                <View key={`${item}-${itemIndex}`} style={[styles.cautionRow, itemIndex === compound.thingsToKnow.length - 1 && styles.cautionRowLast]}>
                  <Text style={styles.cautionText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <DossierSectionLabel marker="V" title="Reference Trail" />
          <ScrollView contentContainerStyle={styles.relatedRail} horizontal showsHorizontalScrollIndicator={false}>
            {relatedCompounds.map((related) => (
              <Pressable
                accessibilityLabel={`Open related dossier for ${related.name}`}
                accessibilityRole="button"
                key={related.id}
                onPress={() => router.push(`/compound/${related.id}`)}
                style={({ pressed }) => [styles.relatedCard, pressed && styles.pressed]}>
                <Text style={styles.relatedNum}>No. {formatIndex(related)}</Text>
                <Text numberOfLines={2} style={styles.relatedName}>{related.name}</Text>
                <Text numberOfLines={1} style={styles.relatedNick}>{related.nickname}</Text>
                <Text style={styles.relatedOpen}>Open -&gt;</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <DossierSectionLabel marker="VI" title="Private Memo" />
          <View accessibilityLabel="Private memo" accessible style={styles.notesCard}>
            <RefBadge label="Local note" />
            <Text style={styles.notesTitle}>Add your observation layer here.</Text>
            <Text style={styles.notesCopy}>A quiet space for clinician context, tolerability notes, and personal research questions.</Text>
          </View>
        </View>

        <View style={styles.twinCtas}>
          <Pressable
            accessibilityLabel={tracked ? `Open tracker log for ${compound.name}` : `Add tracker for ${compound.name}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isReady && !tracked }}
            disabled={!isReady && !tracked}
            onPress={handleTrackerPress}
            style={({ pressed }) => [styles.primaryPill, !isReady && !tracked && styles.disabled, pressed && styles.pressed]}>
            <Ionicons color={colors.accentInk} name={tracked ? 'reader-outline' : 'add'} size={18} />
            <Text style={styles.primaryPillText}>{tracked ? 'Open Log' : 'Add tracker'}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`${saved ? 'Remove saved item' : 'Save item'} ${compound.name}`}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            onPress={handleFavorite}
            style={({ pressed }) => [styles.secondaryPill, saved && styles.secondaryPillOn, pressed && styles.pressed]}>
            <Ionicons color={saved ? colors.accent : colors.textMuted} name={isPro ? (saved ? 'bookmark' : 'bookmark-outline') : 'lock-closed-outline'} size={16} />
            <Text style={[styles.secondaryPillText, saved && styles.secondaryPillTextOn]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        </View>

        {!isReady ? (
          <View style={styles.routinePanel}>
            <Text style={styles.routineKicker}>Routine</Text>
            <Text style={styles.routineTitle}>{tracked ? 'Already in your routine' : 'Add to your routine?'}</Text>
            <Text style={styles.routineCopy}>
              Tracker state is loading. Once ready, the gold action above opens the private setup sheet for your own record.
            </Text>
          </View>
        ) : null}

        {isPro ? (
          <Pressable accessibilityLabel="Re-run the Glowmax guide" accessibilityRole="button" onPress={() => router.push('/quiz')} style={({ pressed }) => [styles.quizCta, pressed && styles.pressed]}>
            <Text style={styles.quizKicker}>GUIDE</Text>
            <Text style={styles.quizTitle}>Re-run the Glowmax guide</Text>
            <Text style={styles.quizCopy}>Compare this dossier against your current goals and saved education interests.</Text>
            <Text style={styles.quizAction}>Begin -&gt;</Text>
          </Pressable>
        ) : null}

        <Text style={styles.disclaimer}>
          {compound.trackingDisclaimer} This page is educational only and does not provide dosing, sourcing, medical, or product guidance.
        </Text>
      </ScrollView>
      <RoutineSetupSheet
        compound={compound}
        onClose={() => setSetupOpen(false)}
        onSaved={() => router.replace('/(tabs)')}
        visible={setupOpen}
      />
    </SafeAreaView>
  );
}

function DossierMeta({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.dossierMetaRow}>
      <Text style={styles.dossierMetaKey}>{k}</Text>
      <Text style={styles.dossierMetaValue}>{v.toUpperCase()}</Text>
    </View>
  );
}

function DossierSectionLabel({ marker, title }: { marker: string; title: string }) {
  return (
    <View style={styles.dossierSectionLabel}>
      <Text style={styles.dossierSectionMarker}>{marker}</Text>
      <Text style={styles.dossierSectionTitle}>{title.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionDot: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  actionWord: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  actionWordOn: {
    color: colors.accent,
  },
  actionWords: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  backLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: 40,
    paddingRight: 12,
  },
  backLinkText: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  cautionCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  cautionRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  cautionRowLast: {
    borderBottomWidth: 0,
  },
  cautionRows: {
    flex: 1,
  },
  cautionText: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
  content: {
    alignSelf: 'center',
    paddingBottom: 150,
    paddingHorizontal: rhythm.screenX,
    paddingTop: 14,
    width: '100%',
  },
  disabled: {
    opacity: 0.46,
  },
  disclaimer: {
    ...t.bodySmall,
    color: colors.textDim,
    marginTop: 22,
  },
  dossierMetaKey: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    width: 58,
  },
  dossierMetaRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 7,
  },
  dossierMetaValue: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 15,
  },
  dossierSectionLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  dossierSectionMarker: {
    color: colors.accent,
    fontFamily: fonts.serif,
    fontSize: 15,
    fontStyle: 'italic',
    letterSpacing: 0.7,
    lineHeight: 20,
  },
  dossierSectionTitle: {
    color: colors.accent,
    fontFamily: fonts.serif,
    fontSize: 15,
    fontStyle: 'italic',
    letterSpacing: 1.4,
    lineHeight: 20,
  },
  dossierStrip: {
    alignItems: 'center',
    borderColor: 'rgba(212, 168, 75, 0.28)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  dropCap: {
    color: colors.accent,
    fontFamily: fonts.serifLight,
    fontSize: 76,
    lineHeight: 76,
    marginRight: 12,
    marginTop: -5,
  },
  evidenceRail: {
    gap: 8,
    paddingRight: 2,
  },
  fileDot: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
  },
  fileLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  fileLineText: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  hero: {
    minHeight: 246,
    overflow: 'hidden',
    paddingBottom: 18,
    paddingTop: 20,
    position: 'relative',
  },
  heroNumber: {
    color: 'rgba(212, 168, 75, 0.035)',
    fontFamily: fonts.serifLight,
    fontSize: 168,
    fontStyle: 'italic',
    letterSpacing: -9,
    lineHeight: 168,
    position: 'absolute',
    right: -8,
    top: -12,
  },
  leadBlock: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: 4,
  },
  leadText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 25,
    paddingTop: 6,
  },
  identityTable: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    paddingTop: 15,
  },
  metaCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  missingWrap: {
    flex: 1,
    paddingHorizontal: rhythm.screenX,
    paddingTop: 20,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 62,
    letterSpacing: -2.4,
    lineHeight: 66,
    marginTop: 16,
    maxWidth: 315,
  },
  nickname: {
    color: colors.accent,
    fontFamily: fonts.serif,
    fontSize: 19,
    fontStyle: 'italic',
    lineHeight: 25,
    marginTop: 8,
    maxWidth: 285,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(212, 168, 75, 0.34)',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 18,
  },
  notesCopy: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginTop: 8,
  },
  notesTitle: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 24,
    letterSpacing: -0.35,
    lineHeight: 28,
    marginTop: 18,
  },
  overviewSection: {
    marginTop: 26,
  },
  pressed: {
    opacity: 0.84,
  },
  primaryPill: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryPillText: {
    color: colors.accentInk,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  pullQuote: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 14,
    marginTop: 22,
  },
  quoteCaption: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  quoteCopy: {
    flex: 1,
  },
  quoteRule: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    width: 2,
  },
  quoteText: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 22,
    fontStyle: 'italic',
    letterSpacing: -0.25,
    lineHeight: 30,
  },
  quizAction: {
    color: colors.accent,
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.1,
    marginTop: 18,
    textTransform: 'uppercase',
  },
  quizCopy: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginTop: 8,
  },
  quizCta: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(212, 168, 75, 0.28)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
    padding: 18,
  },
  quizKicker: {
    ...t.eyebrow,
    color: colors.accent,
  },
  quizTitle: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 26,
    letterSpacing: -0.45,
    lineHeight: 31,
    marginTop: 10,
  },
  referenceLine: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  relatedCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 156,
    padding: 14,
    width: 154,
  },
  relatedName: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 23,
    letterSpacing: -0.45,
    lineHeight: 27,
    marginTop: 18,
  },
  relatedNick: {
    color: colors.textMuted,
    fontFamily: fonts.serif,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 6,
  },
  relatedNum: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  relatedOpen: {
    color: colors.accent,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 'auto',
    textTransform: 'uppercase',
  },
  relatedRail: {
    gap: 10,
    paddingRight: rhythm.screenX,
  },
  routineCopy: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginTop: 8,
  },
  routineKicker: {
    ...t.eyebrow,
    color: colors.accent,
  },
  routinePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
    padding: 16,
  },
  routineTitle: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 24,
    letterSpacing: -0.35,
    lineHeight: 28,
    marginTop: 10,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryPill: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  secondaryPillOn: {
    backgroundColor: 'rgba(212, 168, 75, 0.08)',
    borderColor: 'rgba(212, 168, 75, 0.34)',
  },
  secondaryPillText: {
    color: colors.textMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  secondaryPillTextOn: {
    color: colors.accent,
  },
  section: {
    marginTop: 30,
  },
  shieldPlate: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 168, 75, 0.1)',
    borderColor: 'rgba(212, 168, 75, 0.22)',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  topNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twinCtas: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 30,
  },
  volumeText: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
