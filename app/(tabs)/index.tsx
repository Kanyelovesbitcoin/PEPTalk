import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkinQuizCta } from '@/components/home/SkinQuizCta';
import { RoutineSetupSheet } from '@/components/tracker/RoutineSetupSheet';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors } from '@/lib/constants/colors';
import { rhythm } from '@/lib/constants/layout';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { fonts, type as t } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';
import { useAdaptiveLayout } from '@/lib/hooks/useAdaptiveLayout';
import { usePro } from '@/lib/hooks/usePro';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { useTracker } from '@/lib/hooks/useTracker';
import { hapticLight } from '@/lib/utils/haptics';
import { consumeFreeModeNotice } from '@/lib/utils/freeModeNotice';
import { showPaywallWithAlert } from '@/lib/utils/paywallAlerts';
import { storage } from '@/lib/utils/storage';
import { parseJsonValue } from '@/lib/utils/storageJson';
import { buildTodayRotationQueue, type TodayRotationItem, type TodayRotationLane } from '@/lib/utils/todayRotation';

function upcomingLabel(item: TodayRotationItem | null) {
  if (!item) return 'No upcoming trackers';
  return `${item.compoundName} - ${new Date(item.scheduledAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} at ${item.timeLabel}`;
}

const TIER_COPY: Record<string, string> = {
  primary: 'Core pick',
  secondary: 'Companion',
  supporting: 'Support',
};

interface HomeStatTile {
  label: string;
  note: string;
  onPress?: () => void;
  value: string;
}

export default function TodayScreen() {
  const layout = useAdaptiveLayout();
  const { savedStacks } = useQuiz();
  const { hasEntitlement, isPro, showPaywall } = usePro();
  const {
    clearScheduledDoseForToday,
    logScheduledDoseStatus,
    schedules,
    todayCheckIn,
    todayLogs,
  } = useTracker();
  const [freeModeNotice, setFreeModeNoticeState] = useState<string | null>(null);
  const [setupScheduleId, setSetupScheduleId] = useState<string | null>(null);
  const [hasSkinQuizResult, setHasSkinQuizResult] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([consumeFreeModeNotice(), storage.getItem(STORAGE_KEYS.skinQuizResult)]).then(([notice, storedSkinResult]) => {
        if (!active) return;
        if (notice) {
          setFreeModeNoticeState(notice);
        }
        const parsed = parseJsonValue<{ completedAt?: string } | null>(
          storedSkinResult,
          null,
          STORAGE_KEYS.skinQuizResult,
        );
        setHasSkinQuizResult(Boolean(parsed?.completedAt));
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const activeSchedules = useMemo(() => schedules.filter((schedule) => schedule.active), [schedules]);
  const rotation = useMemo(
    () => buildTodayRotationQueue(schedules, todayLogs),
    [schedules, todayLogs],
  );
  const setupSchedule = setupScheduleId ? schedules.find((schedule) => schedule.id === setupScheduleId) ?? null : null;
  const setupCompound = setupSchedule ? compoundById[setupSchedule.compoundId] ?? null : null;
  const latestSavedStack = savedStacks[0] ?? null;
  const savedStackItems = useMemo(
    () =>
      latestSavedStack
        ? latestSavedStack.compounds.slice(0, 4).map((match) => {
            const compound = compoundById[match.compoundId];
            return {
              id: match.compoundId,
              name: compound?.name ?? 'Peptide',
              tier: match.tier,
            };
          })
        : [],
    [latestSavedStack],
  );

  const progressLabel = rotation.totalCount > 0
    ? `${rotation.completedCount}/${rotation.totalCount}`
    : activeSchedules.length > 0
      ? '0'
      : '0';

  const statTiles: HomeStatTile[] = [
    {
      label: 'Stack',
      value: progressLabel,
      note: rotation.totalCount > 0 ? 'Today' : 'Queue',
      onPress: () => router.push('/(tabs)/tracker'),
    },
    activeSchedules.length > 0
      ? { label: 'Trackers', value: String(activeSchedules.length), note: 'Active' }
      : { label: 'Trackers', value: '0', note: 'First', onPress: () => router.push('/(tabs)/library') },
    todayCheckIn
      ? { label: 'Check-in', value: 'Saved', note: 'Private' }
      : { label: 'Check-in', value: '0', note: '30 sec', onPress: () => router.push('/(tabs)/tracker') },
  ];

  function logItem(item: TodayRotationItem) {
    if (!item.canLog) {
      setSetupScheduleId(item.schedule.id);
      return;
    }
    hapticLight();
    logScheduledDoseStatus(item.schedule.id, 'taken');
  }

  function skipItem(item: TodayRotationItem) {
    if (!item.canLog) {
      setSetupScheduleId(item.schedule.id);
      return;
    }
    hapticLight();
    logScheduledDoseStatus(item.schedule.id, 'skipped');
  }

  function undoItem(item: TodayRotationItem) {
    hapticLight();
    clearScheduledDoseForToday(item.schedule.id);
  }

  function editItem(item: TodayRotationItem) {
    hapticLight();
    setSetupScheduleId(item.schedule.id);
  }

  const nextStep = useMemo(() => {
    if (rotation.nextItem) {
      return {
        label: rotation.nextItem.canLog ? `Log ${rotation.nextItem.compoundName}` : `Finish ${rotation.nextItem.compoundName} setup`,
        onPress: () => (rotation.nextItem ? (rotation.nextItem.canLog ? logItem(rotation.nextItem) : editItem(rotation.nextItem)) : undefined),
      };
    }
    if (activeSchedules.length === 0) {
      return { label: 'Add your first tracker', onPress: () => router.push('/(tabs)/library') };
    }
    if (!todayCheckIn) {
      return { label: 'Save today\'s check-in', onPress: () => router.push('/(tabs)/tracker') };
    }
    return { label: 'Review your library', onPress: () => router.push('/(tabs)/library') };
  }, [activeSchedules.length, rotation.nextItem, todayCheckIn]);

  const hasSkinQuizUnlock = isPro || hasEntitlement('skin_quiz_unlock');

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { maxWidth: layout.pageMaxWidth }]} showsVerticalScrollIndicator={false}>
        <View style={styles.masthead}>
          <View style={styles.brandCluster}>
            <BrandLogo height={44} width={36} />
            <View style={styles.headerText}>
              <Text numberOfLines={1} style={styles.brand}>Good evening. Today</Text>
            </View>
          </View>
          <Pressable accessibilityLabel="Open settings" accessibilityRole="button" onPress={() => router.push('/profile-modal')} style={styles.iconBtn}>
            <Ionicons color={colors.textMuted} name="person-outline" size={16} />
          </Pressable>
        </View>

        <SkinQuizCta
          hasCompletedResult={hasSkinQuizUnlock && hasSkinQuizResult}
          onPress={() => {
            router.push((hasSkinQuizUnlock && hasSkinQuizResult ? '/skin-quiz/results' : '/skin-quiz') as never);
          }}
        />

        <View style={styles.statGrid}>
          {statTiles.map((tile) => (
            <StatTile key={tile.label} label={tile.label} note={tile.note} onPress={tile.onPress} value={tile.value} />
          ))}
        </View>

        {freeModeNotice && !isPro ? (
          <Pressable
            accessibilityLabel="Dismiss free mode notice"
            accessibilityRole="button"
            onPress={() => setFreeModeNoticeState(null)}
            style={({ pressed }) => [styles.noticePanel, pressed && styles.pressed]}>
            <Ionicons color={colors.accent} name="information-circle-outline" size={17} />
            <Text style={styles.noticeText}>{freeModeNotice}</Text>
            <Ionicons color={colors.textDim} name="close" size={14} />
          </Pressable>
        ) : null}

        {!isPro ? (
          <View style={styles.freeModePanel}>
            <Text style={styles.freeModeKicker}>FREE MODE</Text>
            <Text style={styles.freeModeTitle}>Stack included.</Text>
            <Text style={styles.freeModeCopy}>
              Free mode keeps Library browsing, local logs, daily check-ins, and Today's stack available. Pro adds deep guide context, exports, Saved, and private reminders.
            </Text>
            <View style={styles.freeModeActions}>
              <Pressable accessibilityLabel="Open stack" accessibilityRole="button" onPress={() => router.push('/(tabs)/tracker')} style={({ pressed }) => [styles.freeModeButton, pressed && styles.pressed]}>
                <Text style={styles.freeModeButtonText}>Open stack</Text>
                <Ionicons color={colors.accentInk} name="repeat" size={15} />
              </Pressable>
              <Pressable accessibilityLabel="Open Library" accessibilityRole="button" onPress={() => router.push('/(tabs)/library')} style={({ pressed }) => [styles.freeModeGhost, pressed && styles.pressed]}>
                <Text style={styles.freeModeGhostText}>Library</Text>
              </Pressable>
              <Pressable accessibilityLabel="Start Pro trial" accessibilityRole="button" onPress={() => { void showPaywallWithAlert(showPaywall); }} style={({ pressed }) => [styles.freeModeGhost, pressed && styles.pressed]}>
                <Text style={styles.freeModeGhostText}>Trial</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <SectionHeader label="Stack" title={rotation.totalCount > 0 ? "Morning and night stack" : 'Nothing scheduled'} />
        {rotation.totalCount > 0 ? (
          <>
            <RotationLanePanel lane={rotation.morning} onEdit={editItem} onLog={logItem} onSkip={skipItem} onUndo={undoItem} />
            <RotationLanePanel lane={rotation.night} onEdit={editItem} onLog={logItem} onSkip={skipItem} onUndo={undoItem} />
          </>
        ) : activeSchedules.length > 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyZero}>0</Text>
            <Text style={styles.emptySub}>Nothing due today.</Text>
            <Pressable accessibilityLabel="Open log" accessibilityRole="button" onPress={() => router.push('/(tabs)/tracker')} style={styles.emptyCta}>
              <Text style={styles.emptyCtaText}>Open log</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyZero}>0</Text>
            <Text style={styles.emptySub}>No trackers yet.</Text>
            <Pressable accessibilityLabel="Open Library" accessibilityRole="button" onPress={() => router.push('/(tabs)/library')} style={styles.emptyCta}>
              <Text style={styles.emptyCtaText}>Add your first tracker</Text>
            </Pressable>
          </View>
        )}

        <SectionHeader
          label={savedStackItems.length > 0 ? 'From guide' : 'Next step'}
          title={savedStackItems.length > 0 ? 'Saved for later' : 'Save for later'}
        />
        {savedStackItems.length > 0 ? (
          <View style={styles.listCard}>
            {savedStackItems.map((item, index) => (
              <Pressable
                accessibilityLabel={`Open saved item ${item.name}`}
                accessibilityRole="button"
                key={item.id}
                onPress={() => router.push(`/compound/${item.id}`)}
                style={[styles.trackRow, index < savedStackItems.length - 1 && styles.trackRowBorder]}>
                <View style={styles.trackMark}>
                  <Ionicons color={colors.accent} name="bookmark-outline" size={16} />
                </View>
                <View style={styles.trackBody}>
                  <Text style={styles.trackName}>{item.name}</Text>
                  <Text style={styles.trackMeta}>Saved - {TIER_COPY[item.tier] ?? item.tier}</Text>
                </View>
                <Text style={styles.trackStatus}>Saved</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyZero}>0</Text>
            <Text style={styles.emptySub}>No saved compounds yet.</Text>
            <Pressable accessibilityLabel="Open Library" accessibilityRole="button" onPress={() => router.push('/(tabs)/library')} style={styles.emptyCta}>
              <Text style={styles.emptyCtaText}>Browse library</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityLabel={nextStep.label}
          accessibilityRole="button"
          onPress={() => {
            hapticLight();
            nextStep.onPress();
          }}
          style={styles.primaryCta}>
          <Text style={styles.primaryCtaText}>{nextStep.label}</Text>
          <Ionicons color={colors.accentInk} name="arrow-forward" size={18} />
        </Pressable>

        <Text style={styles.footnote}>GlowPep is for private education and tracking only. It does not diagnose, treat, prescribe, recommend products, recommend amounts, or provide medical advice.</Text>
      </ScrollView>
      <RoutineSetupSheet
        compound={setupCompound}
        existingSchedule={setupSchedule}
        onClose={() => setSetupScheduleId(null)}
        visible={Boolean(setupCompound && setupSchedule)}
      />
    </SafeAreaView>
  );
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <View style={[styles.sectionHead, { alignItems: 'center' }]}>
      <Text style={[styles.sectionLabel, { textAlign: 'center' }]}>{label}</Text>
      <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>{title}</Text>
    </View>
  );
}

function StatTile({ label, note, onPress, value }: { label: string; note: string; onPress?: () => void; value: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    if (!onPress) return;
    hapticLight();
    onPress();
  }

  const isZero = value === '0';
  const content = (
    <>
      {isZero ? (
        <View style={styles.statZeroRing}>
          <Text style={styles.statZeroText}>0</Text>
        </View>
      ) : (
        <Animated.Text style={[styles.statValue, { transform: [{ scale }] }]} numberOfLines={1}>{value}</Animated.Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statNote}>{note}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={`${label}: ${value}. ${note}`}
        accessibilityRole="button"
        onPress={handlePress}
        onPressIn={() => Animated.spring(scale, { speed: 24, toValue: 1.06, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { speed: 20, toValue: 1, useNativeDriver: true }).start()}
        style={({ pressed }) => [styles.statTile, styles.statTileAction, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={`${label}: ${value}. ${note}`} accessible style={styles.statTile}>
      {content}
    </View>
  );
}

function RotationLanePanel({
  lane,
  onEdit,
  onLog,
  onSkip,
  onUndo,
}: {
  lane: TodayRotationLane;
  onEdit: (item: TodayRotationItem) => void;
  onLog: (item: TodayRotationItem) => void;
  onSkip: (item: TodayRotationItem) => void;
  onUndo: (item: TodayRotationItem) => void;
}) {
  const featured = lane.featuredItem;
  const secondaryItems = [...lane.queuedItems, ...lane.completedItems];

  if (lane.totalCount === 0) {
    return (
      <View style={styles.rotationLane}>
        <View style={styles.rotationLaneHead}>
          <Text style={styles.rotationKicker}>{lane.label.toUpperCase()}</Text>
          <Text style={styles.rotationCount}>Blank</Text>
        </View>
        <Text style={styles.rotationLaneEmpty}>No trackers in this lane yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.rotationLane}>
      <View style={styles.rotationLaneHead}>
        <Text style={styles.rotationKicker}>{lane.label.toUpperCase()}</Text>
        <Text style={styles.rotationCount}>{lane.completedCount}/{lane.totalCount}</Text>
      </View>
      {featured ? (
        <View style={styles.rotationFeature}>
          <Text style={styles.rotationStatusText}>{featured.status === 'setup' ? 'Setup needed' : 'Current peptide'}</Text>
          <Text style={styles.rotationTitle}>{featured.compoundName}</Text>
          <Text style={styles.rotationMeta}>{featured.amountLabel} - {featured.routeLabel} - {featured.timeLabel}</Text>
          {featured.injectionSite ? <Text style={styles.rotationMeta}>Site note: {featured.injectionSite}</Text> : null}
          <View style={styles.rotationActions}>
            <Pressable accessibilityLabel={featured.canLog ? `Log ${featured.compoundName}` : `Set amount for ${featured.compoundName}`} accessibilityRole="button" onPress={() => (featured.canLog ? onLog(featured) : onEdit(featured))} style={({ pressed }) => [styles.rotationPrimary, pressed && styles.pressed]}>
              <Text style={styles.rotationPrimaryText}>{featured.canLog ? 'Log' : 'Set amount'}</Text>
              <Ionicons color={colors.accentInk} name={featured.canLog ? 'checkmark' : 'create-outline'} size={16} />
            </Pressable>
            {featured.canLog ? (
              <Pressable accessibilityLabel={`Skip ${featured.compoundName}`} accessibilityRole="button" onPress={() => onSkip(featured)} style={({ pressed }) => [styles.rotationSecondary, pressed && styles.pressed]}>
                <Text style={styles.rotationSecondaryText}>Skip</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityLabel={`Edit ${featured.compoundName}`} accessibilityRole="button" onPress={() => onEdit(featured)} style={({ pressed }) => [styles.rotationSecondary, pressed && styles.pressed]}>
              <Text style={styles.rotationSecondaryText}>Edit</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.rotationFeature}>
          <Text style={styles.rotationStatusText}>Lane complete</Text>
          <Text style={styles.rotationTitle}>All handled</Text>
          <Text style={styles.rotationMeta}>Logged and skipped items stay below for quick undo.</Text>
        </View>
      )}

      {secondaryItems.length > 0 ? (
        <View style={styles.rotationMiniRow}>
          {secondaryItems.map((item) => (
            <Pressable
              accessibilityLabel={`${item.status === 'taken' || item.status === 'skipped' ? 'Undo' : 'Edit'} ${item.compoundName}`}
              accessibilityRole="button"
              key={item.schedule.id}
              onPress={() => (item.status === 'taken' || item.status === 'skipped' ? onUndo(item) : onEdit(item))}
              style={({ pressed }) => [styles.rotationMini, (item.status === 'taken' || item.status === 'skipped') && styles.rotationMiniDone, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={styles.rotationMiniName}>{item.compoundName}</Text>
              <Text style={styles.rotationMiniMeta}>
                {item.status === 'taken' ? 'Done' : item.status === 'skipped' ? 'Skipped' : item.timeLabel}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function RotationPanel({
  completedCount,
  item,
  nextUpcoming,
  onEdit,
  onLog,
  onSkip,
  totalCount,
}: {
  completedCount: number;
  item: TodayRotationItem | null;
  nextUpcoming: TodayRotationItem | null;
  onEdit: (item: TodayRotationItem) => void;
  onLog: (item: TodayRotationItem) => void;
  onSkip: (item: TodayRotationItem) => void;
  totalCount: number;
}) {
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!item) {
    return (
      <View style={styles.rotationCard}>
        <View style={styles.rotationHead}>
          <Text style={styles.rotationKicker}>ROTATION COMPLETE</Text>
          <Text style={styles.rotationCount}>{completedCount}/{totalCount}</Text>
        </View>
        <Text style={styles.rotationTitle}>All due trackers are handled.</Text>
        <Text style={styles.rotationCopy}>Next up: {upcomingLabel(nextUpcoming)}.</Text>
        <ProgressBar progress={progress} />
      </View>
    );
  }

  return (
    <View style={styles.rotationCard}>
      <View style={styles.rotationHead}>
        <Text style={styles.rotationKicker}>{item.status === 'setup' ? 'SETUP NEEDED' : 'NEXT IN ROTATION'}</Text>
        <Text style={styles.rotationCount}>{completedCount}/{totalCount}</Text>
      </View>
      <Text style={styles.rotationTitle}>{item.compoundName}</Text>
      <Text style={styles.rotationMeta}>{item.amountLabel} - {item.routeLabel} - {item.timeLabel}</Text>
      {item.injectionSite ? <Text style={styles.rotationMeta}>Site note: {item.injectionSite}</Text> : null}
      <ProgressBar progress={progress} />
      <View style={styles.rotationActions}>
        <Pressable onPress={() => (item.canLog ? onLog(item) : onEdit(item))} style={({ pressed }) => [styles.rotationPrimary, pressed && styles.pressed]}>
          <Text style={styles.rotationPrimaryText}>{item.canLog ? 'Log' : 'Set amount'}</Text>
          <Ionicons color={colors.accentInk} name={item.canLog ? 'checkmark' : 'create-outline'} size={16} />
        </Pressable>
        {item.canLog ? (
          <Pressable onPress={() => onSkip(item)} style={({ pressed }) => [styles.rotationSecondary, pressed && styles.pressed]}>
            <Text style={styles.rotationSecondaryText}>Skip</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => onEdit(item)} style={({ pressed }) => [styles.rotationSecondary, pressed && styles.pressed]}>
          <Text style={styles.rotationSecondaryText}>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(5, Math.min(100, progress))}%` }]} />
    </View>
  );
}

function RotationRow({
  item,
  onEdit,
  onUndo,
  showBorder,
}: {
  item: TodayRotationItem;
  onEdit: (item: TodayRotationItem) => void;
  onUndo: (item: TodayRotationItem) => void;
  showBorder: boolean;
}) {
  const done = item.status === 'taken' || item.status === 'skipped';
  const iconName: keyof typeof Ionicons.glyphMap = item.status === 'taken'
    ? 'checkmark'
    : item.status === 'skipped'
      ? 'remove'
      : item.status === 'setup'
        ? 'create-outline'
        : 'ellipse-outline';
  const statusLabel = item.status === 'setup' ? 'Setup' : item.status === 'taken' ? 'Done' : item.status === 'skipped' ? 'Skipped' : 'To do';

  return (
    <View style={[styles.trackRow, showBorder && styles.trackRowBorder]}>
      <View style={[styles.trackMark, done && styles.trackMarkDone]}>
        <Ionicons color={done ? colors.accentInk : colors.accent} name={iconName} size={16} />
      </View>
      <View style={styles.trackBody}>
        <Text style={styles.trackName}>{item.compoundName}</Text>
        <Text style={styles.trackMeta}>{item.amountLabel} - {item.routeLabel} - {item.timeLabel}</Text>
      </View>
      <View style={styles.trackActions}>
        <Text style={[styles.trackStatus, done && styles.trackStatusDone]}>{statusLabel}</Text>
        {done ? (
          <Pressable hitSlop={8} onPress={() => onUndo(item)}>
            <Text style={styles.trackActionText}>Undo</Text>
          </Pressable>
        ) : (
          <Pressable hitSlop={8} onPress={() => onEdit(item)}>
            <Text style={styles.trackActionText}>{item.status === 'setup' ? 'Setup' : 'Edit'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  scroll: { alignSelf: 'center', paddingBottom: rhythm.screenBottomTabs, paddingHorizontal: rhythm.screenX, paddingTop: rhythm.screenTop, width: '100%' },
  masthead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: rhythm.mastheadBottom },
  brandCluster: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 },
  headerText: { flex: 1, minWidth: 0, paddingRight: 12 },
  brand: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 26, letterSpacing: 0 },
  date: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.1, marginTop: 4, textTransform: 'uppercase' },
  iconBtn: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, height: 44, justifyContent: 'center', position: 'relative', width: 44 },
  hero: { marginBottom: 22 },
  kicker: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.accent}18`,
    borderColor: `${colors.accent}55`,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.accent,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    letterSpacing: 1.5,
    lineHeight: 18,
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 39, letterSpacing: 0, lineHeight: 42, maxWidth: 320 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 340 },
  statGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statTile: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flex: 1, minHeight: 112, padding: 14 },
  statTileAction: { borderColor: colors.borderStrong },
  statValue: { color: colors.accentSoft, fontFamily: fonts.serifLight, fontSize: 26, letterSpacing: 0, lineHeight: 30, marginBottom: 8 },
  statZeroRing: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.accent,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: 'center',
    marginBottom: 8,
    width: 48,
  },
  statZeroText: { color: colors.textDim, fontFamily: fonts.serifLight, fontSize: 22, lineHeight: 26 },
  statLabel: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 13 },
  statNote: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, marginTop: 4, textTransform: 'uppercase' },
  freeModePanel: {
    backgroundColor: colors.surface,
    borderColor: `${colors.accent}55`,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 30,
    padding: 18,
  },
  noticePanel: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeText: { color: colors.textMuted, flex: 1, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  freeModeKicker: { ...t.eyebrow, color: colors.accent, marginBottom: 8 },
  freeModeTitle: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 30, lineHeight: 34 },
  freeModeCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, marginTop: 8 },
  freeModeActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  freeModeButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 999, flexDirection: 'row', gap: 7, minHeight: 44, paddingHorizontal: 16 },
  freeModeButtonText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 13 },
  freeModeGhost: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 44, paddingHorizontal: 16 },
  freeModeGhostText: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 13 },
  sectionHead: { marginBottom: 12, marginTop: 2 },
  sectionLabel: { ...t.eyebrow, color: colors.accent, marginBottom: 6 },
  sectionTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 18, letterSpacing: -0.2 },
  rotationCard: { backgroundColor: colors.surface, borderColor: `${colors.accent}55`, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, padding: 20 },
  rotationLane: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, padding: 16 },
  rotationLaneHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rotationLaneEmpty: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20 },
  rotationFeature: { backgroundColor: colors.backgroundAlt, borderColor: `${colors.accent}33`, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  rotationHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rotationKicker: { ...t.eyebrow, color: colors.accent },
  rotationCount: { color: colors.textDim, fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2 },
  rotationTitle: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 34, letterSpacing: 0, lineHeight: 38 },
  rotationMeta: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, marginTop: 8 },
  rotationStatusText: { color: colors.accent, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  rotationCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, marginTop: 8 },
  rotationMiniRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  rotationMini: { backgroundColor: colors.backgroundAlt, borderColor: colors.border, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, maxWidth: 148, minHeight: 56, minWidth: 112, paddingHorizontal: 12, paddingVertical: 9 },
  rotationMiniDone: { opacity: 0.66 },
  rotationMiniName: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16 },
  rotationMiniMeta: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, marginTop: 5, textTransform: 'uppercase' },
  progressTrack: { backgroundColor: colors.backgroundAlt, borderRadius: 999, height: 8, marginTop: 18, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.accent, borderRadius: 999, height: 8 },
  rotationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  rotationPrimary: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 14, flexDirection: 'row', gap: 8, minHeight: 46, paddingHorizontal: 18 },
  rotationPrimaryText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 14 },
  rotationSecondary: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 46, paddingHorizontal: 16 },
  rotationSecondaryText: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 13 },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginBottom: 30, padding: 20 },
  emptyZero: { color: colors.accentSoft, fontFamily: fonts.serifLight, fontSize: 42, letterSpacing: 0, lineHeight: 48, textAlign: 'center' },
  emptySub: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, marginTop: 6, marginBottom: 16, textAlign: 'center' },
  emptyCta: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center' },
  emptyCtaText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 13 },
  emptyTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 18, marginBottom: 8 },
  emptyCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  emptyButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignSelf: 'flex-start',
  },
  emptyButtonText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 14 },
  listCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginBottom: 28, overflow: 'hidden' },
  trackRow: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 72, paddingHorizontal: 16, paddingVertical: 12 },
  trackRowBorder: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  trackMark: { alignItems: 'center', backgroundColor: colors.backgroundAlt, borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
  trackMarkDone: { backgroundColor: colors.accent },
  trackBody: { flex: 1, minWidth: 0 },
  trackName: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 15 },
  trackMeta: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 4 },
  trackActions: { alignItems: 'flex-end', gap: 6 },
  trackStatus: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  trackStatusDone: { color: colors.accent },
  trackActionText: { color: colors.textMuted, fontFamily: fonts.sansMedium, fontSize: 11 },
  primaryCta: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 18 },
  primaryCtaText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 15 },
  footnote: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: 'center' },
  pressed: { opacity: 0.84 },
});
