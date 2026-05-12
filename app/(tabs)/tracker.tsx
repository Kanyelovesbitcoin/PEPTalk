import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DoseLogForm } from '@/components/tracker/DoseLogForm';
import { ExportPanel } from '@/components/tracker/ExportPanel';
import { RoutineSetupSheet } from '@/components/tracker/RoutineSetupSheet';
import { TickRow } from '@/components/ui/TickRow';
import { colors } from '@/lib/constants/colors';
import { rhythm } from '@/lib/constants/layout';
import { fonts, type as t } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';
import { useAdaptiveLayout } from '@/lib/hooks/useAdaptiveLayout';
import { useTracker } from '@/lib/hooks/useTracker';
import { hapticLight } from '@/lib/utils/haptics';
import { buildTodayRotationQueue, type TodayRotationItem } from '@/lib/utils/todayRotation';

function formatDateMeta() {
  const now = new Date();
  return {
    day: String(now.getDate()),
    mon: now.toLocaleDateString('en-US', { month: 'short' }),
    year: String(now.getFullYear()),
  };
}

function upcomingLabel(item: TodayRotationItem | null) {
  if (!item) return 'No upcoming trackers are scheduled.';
  return `Next up: ${item.compoundName} on ${new Date(item.scheduledAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} at ${item.timeLabel}.`;
}

export default function LogScreen() {
  const layout = useAdaptiveLayout();
  const params = useLocalSearchParams<{ quickLog?: string }>();
  const {
    clearScheduledDoseForToday,
    deleteSchedule,
    isReady,
    logScheduledDoseStatus,
    schedules,
    todayLogs,
  } = useTracker();
  const [quickLogVisible, setQuickLogVisible] = useState(false);
  const [setupScheduleId, setSetupScheduleId] = useState<string | null>(null);

  const meta = useMemo(formatDateMeta, []);
  const rotation = useMemo(() => buildTodayRotationQueue(schedules, todayLogs), [schedules, todayLogs]);
  const setupSchedule = setupScheduleId ? schedules.find((schedule) => schedule.id === setupScheduleId) ?? null : null;
  const setupCompound = setupSchedule ? compoundById[setupSchedule.compoundId] ?? null : null;

  useEffect(() => {
    if (params.quickLog === '1') {
      setQuickLogVisible(true);
    }
  }, [params.quickLog]);

  function closeQuickLog() {
    setQuickLogVisible(false);
    if (params.quickLog) {
      router.replace('/(tabs)/tracker');
    }
  }

  function logRotationItem(item: TodayRotationItem) {
    if (!isReady) return;
    if (!item.canLog) {
      setSetupScheduleId(item.schedule.id);
      return;
    }
    hapticLight();
    logScheduledDoseStatus(item.schedule.id, 'taken');
  }

  function skipRotationItem(item: TodayRotationItem) {
    if (!isReady) return;
    if (!item.canLog) {
      setSetupScheduleId(item.schedule.id);
      return;
    }
    hapticLight();
    logScheduledDoseStatus(item.schedule.id, 'skipped');
  }

  function undoRotationItem(item: TodayRotationItem) {
    if (!isReady) return;
    hapticLight();
    clearScheduledDoseForToday(item.schedule.id);
  }

  function confirmRemoveTracker(item: TodayRotationItem) {
    Alert.alert(
      'Remove tracker?',
      `This removes ${item.compoundName} from your private routine. Existing log entries stay on this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            hapticLight();
            deleteSchedule(item.schedule.id);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            maxWidth: layout.pageMaxWidth,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.masthead}>
          <View style={styles.mastheadCopy}>
            <Text style={styles.eyebrow}><Text style={styles.eyebrowDot}>* </Text>Private Log</Text>
            <View style={styles.mastheadTicks}>
              <TickRow count={11} />
            </View>
            <Text style={styles.title}>
              Track your{'\n'}
              <Text style={styles.titleAccent}>own routine.</Text>
            </Text>
            <Text style={styles.titleFlair}>Only user-entered tracker details are logged here.</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateNum}>{meta.day}</Text>
            <Text style={styles.dateMeta}>{meta.mon} {meta.year}</Text>
          </View>
        </View>
        <View style={styles.ruleBold} />

        <View style={styles.safetyNote}>
          <Ionicons color={colors.accent} name="shield-checkmark-outline" size={16} />
          <Text style={styles.safetyNoteText}>
            Private education and tracking only. GlowPep does not diagnose, treat, prescribe, recommend products, or choose amounts.
          </Text>
        </View>

        <View style={styles.dosesBlock}>
          <View style={styles.dosesHead}>
            <Text style={styles.sectionLabel}>Tracker details</Text>
            {rotation.totalCount > 0 ? (
              <Text style={styles.dosesMeta}>{rotation.takenCount} logged {rotation.skippedCount > 0 ? `- ${rotation.skippedCount} skipped` : ''}</Text>
            ) : null}
          </View>
          {rotation.dueItems.length === 0 ? (
            <Pressable accessibilityLabel="Open Library to add a tracker" accessibilityRole="button" onPress={() => router.push('/(tabs)/library')} style={styles.dosesEmpty}>
              <Text style={styles.dosesEmptyTitle}>No personal trackers due.</Text>
              <Text style={styles.dosesEmptyCopy}>
                Browse the Library, add anything you personally follow, then keep local notes and amount logs here.
              </Text>
              <View style={styles.dosesEmptyCta}>
                <Text style={styles.dosesEmptyCtaText}>Open library</Text>
                <Text style={styles.dosesEmptyCtaArrow}>-&gt;</Text>
              </View>
            </Pressable>
          ) : (
            rotation.dueItems.map((item) => (
              <DoseDetailRow
                item={item}
                key={item.schedule.id}
                onEdit={() => setSetupScheduleId(item.schedule.id)}
                onLog={() => logRotationItem(item)}
                onRemove={() => confirmRemoveTracker(item)}
                onUndo={() => undoRotationItem(item)}
              />
            ))
          )}
        </View>

        <View style={styles.exportBlock}>
          <ExportPanel />
        </View>

      </ScrollView>
      <RoutineSetupSheet
        compound={setupCompound}
        existingSchedule={setupSchedule}
        onClose={() => setSetupScheduleId(null)}
        visible={Boolean(setupCompound && setupSchedule)}
      />
      <QuickLogSheet onClose={closeQuickLog} visible={quickLogVisible} />
    </SafeAreaView>
  );
}

function DoseDetailRow({
  item,
  onEdit,
  onLog,
  onRemove,
  onUndo,
}: {
  item: TodayRotationItem;
  onEdit: () => void;
  onLog: () => void;
  onRemove: () => void;
  onUndo: () => void;
}) {
  const completed = item.status === 'taken' || item.status === 'skipped';
  const actionLabel = completed
    ? `Undo ${item.compoundName}`
    : item.canLog
      ? `Log ${item.compoundName}`
      : `Set amount for ${item.compoundName}`;

  return (
    <View style={[styles.doseRow, completed && styles.doseRowDone]}>
      <View style={styles.doseLead}>
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          accessibilityState={{ checked: completed }}
          onPress={completed ? onUndo : item.canLog ? onLog : onEdit}
          style={styles.doseCheckTouch}>
          <AnimatedDoseCheck done={completed} skipped={item.status === 'skipped'} />
        </Pressable>
        <View style={styles.doseCopy}>
          <Text style={[styles.doseName, !completed && { color: colors.textMuted }]}>{item.compoundName}</Text>
          <Text style={styles.doseDetail}>{item.amountLabel} - {item.routeLabel}</Text>
        </View>
      </View>
      <View style={styles.doseRight}>
        <Text style={[styles.doseTime, { color: completed ? colors.accent : colors.textDim }]}>{item.timeLabel}</Text>
        {completed ? (
          <Pressable accessibilityLabel={`Undo ${item.compoundName}`} accessibilityRole="button" onPress={onUndo} hitSlop={8} style={styles.doseTextButton}>
            <Text style={styles.removeText}>Undo</Text>
          </Pressable>
        ) : item.canLog ? (
          <Pressable accessibilityLabel={`Log entry for ${item.compoundName}`} accessibilityRole="button" hitSlop={8} onPress={onLog} style={styles.doseTextButton}>
            <Text style={styles.logDoseText}>Log entry</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityLabel={`Set amount for ${item.compoundName}`} accessibilityRole="button" hitSlop={8} onPress={onEdit} style={styles.doseTextButton}>
            <Text style={styles.logDoseText}>Set amount</Text>
          </Pressable>
        )}
        {!completed ? (
          <Pressable accessibilityLabel={`Remove ${item.compoundName} tracker`} accessibilityRole="button" onPress={onRemove} hitSlop={8} style={styles.doseTextButton}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function AnimatedDoseCheck({ done, skipped }: { done: boolean; skipped: boolean }) {
  const scale = useRef(new Animated.Value(done ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      speed: 20,
      toValue: done ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [done, scale]);

  return (
    <View style={[styles.doseCheck, { borderColor: done ? colors.accent : colors.borderStrong }]}>
      <Animated.View style={[styles.doseCheckFill, { transform: [{ scale }] }]}>
        <Ionicons color={colors.background} name={skipped ? 'remove' : 'checkmark'} size={14} />
      </Animated.View>
    </View>
  );
}

function QuickLogSheet({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const layout = useAdaptiveLayout();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.quickLogScrim}>
        <SafeAreaView edges={['bottom']} style={styles.quickLogSafe}>
          <View style={[styles.quickLogSheet, layout.isTablet && styles.quickLogSheetTablet]}>
            <View style={styles.quickLogHandle} />
            <View style={styles.quickLogHead}>
              <View>
                <Text style={styles.quickLogKicker}>QUICK LOG</Text>
                <Text style={styles.quickLogTitle}>Log an entry</Text>
              </View>
              <Pressable accessibilityLabel="Close quick log" accessibilityRole="button" hitSlop={12} onPress={onClose} style={styles.quickLogClose}>
                <Ionicons color={colors.textMuted} name="close" size={20} />
              </Pressable>
            </View>
            <DoseLogForm onClose={onClose} onSaved={onClose} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  scroll: { alignSelf: 'center', paddingBottom: rhythm.screenBottomTabs, width: '100%' },
  masthead: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    overflow: 'hidden',
    paddingBottom: 18,
    paddingHorizontal: rhythm.screenX,
    paddingTop: rhythm.screenTop,
    position: 'relative',
  },
  mastheadCopy: { flex: 1, zIndex: 1 },
  mastheadTicks: { marginTop: 8 },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  eyebrowDot: { color: colors.accent, fontSize: 9 },
  sectionLabel: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    letterSpacing: -0.1,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 38,
    letterSpacing: -1.4,
    lineHeight: 40,
    marginTop: 6,
  },
  titleAccent: { color: colors.accent },
  titleFlair: {
    color: colors.textDim,
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.2,
    marginTop: 8,
  },
  dateBlock: { alignItems: 'flex-end' },
  dateNum: {
    color: colors.accent,
    fontFamily: fonts.serifLight,
    fontSize: 36,
    letterSpacing: -1.2,
    lineHeight: 38,
    paddingTop: 4,
  },
  dateMeta: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 4,
  },
  ruleBold: { backgroundColor: colors.borderStrong, height: StyleSheet.hairlineWidth },
  rotationBlock: { paddingHorizontal: rhythm.screenX, paddingVertical: 20 },
  rotationHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  rotationStage: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: `${colors.accent}44`,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  rotationStageHead: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rotationStageKicker: { color: colors.accent, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  rotationStageCount: { color: colors.textDim, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  orbitWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 6 },
  orbitRing: {
    alignItems: 'center',
    borderColor: 'rgba(212,168,75,0.22)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 206,
    justifyContent: 'center',
    position: 'relative',
    width: 206,
  },
  orbitArrowTop: {
    position: 'absolute',
    right: 8,
    top: 10,
    transform: [{ rotate: '35deg' }],
  },
  orbitArrowBottom: {
    bottom: 10,
    left: 8,
    position: 'absolute',
    transform: [{ rotate: '215deg' }],
  },
  orbitCore: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  orbitCoreText: { color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.1, marginTop: 5, textTransform: 'uppercase' },
  rotationStageTitle: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 32, letterSpacing: 0, lineHeight: 36, marginTop: 8, textAlign: 'center' },
  rotationStageCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 360, textAlign: 'center' },
  rotationStageButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48,
    minWidth: 172,
    paddingHorizontal: 18,
  },
  rotationStageButtonText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 13 },
  rotationLanes: { gap: 12, marginTop: 2 },
  rotationLane: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  rotationLaneHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rotationLaneTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 15, letterSpacing: -0.1 },
  rotationLaneCount: { color: colors.textDim, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  rotationLaneBlank: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20 },
  rotationFeatureCard: {
    backgroundColor: colors.backgroundAlt,
    borderColor: `${colors.accent}33`,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 15,
  },
  rotationFeatureLabel: { color: colors.accent, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.1, marginBottom: 8, textTransform: 'uppercase' },
  rotationFeatureName: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 30, letterSpacing: 0, lineHeight: 34 },
  rotationLaneGhostButton: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 42, paddingHorizontal: 14 },
  rotationMiniRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  rotationChip: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
    minWidth: 104,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  rotationChipDone: { opacity: 0.64 },
  rotationChipName: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16 },
  rotationChipMeta: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, marginTop: 4, textTransform: 'uppercase' },
  rotationRail: { gap: 12, paddingRight: rhythm.screenX },
  rotationCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 190,
    padding: 16,
    width: 260,
  },
  rotationCardSelected: { borderColor: `${colors.accent}88` },
  rotationCardComplete: { opacity: 0.86 },
  rotationCardHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rotationStatus: { color: colors.textDim, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  rotationStatusDone: { color: colors.accent },
  rotationName: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 27, lineHeight: 31 },
  rotationMeta: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 6 },
  rotationActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  rotationPrimaryButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 12, flex: 1, justifyContent: 'center', minHeight: 42, paddingHorizontal: 14 },
  rotationPrimaryText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 13 },
  rotationGhostButton: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', marginTop: 16, minHeight: 42, paddingHorizontal: 14 },
  rotationGhostText: { color: colors.textMuted, fontFamily: fonts.sansMedium, fontSize: 12 },
  rotationEmpty: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  rotationEmptyTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 17, marginBottom: 8 },
  rotationEmptyCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  safetyNote: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: rhythm.controlRadius,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: rhythm.screenX,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  safetyNoteText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  ratingStack: {
    gap: 12,
    paddingHorizontal: rhythm.screenX,
    paddingVertical: 18,
  },
  ratingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  ratingHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  ratingTitleBlock: { flex: 1, minWidth: 0 },
  ratingTitle: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 22, letterSpacing: 0, lineHeight: 26 },
  ratingDescription: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  ratingLabel: { color: colors.accentSoft, fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 20 },
  ratingPills: { flexDirection: 'row', gap: 8, marginTop: 14 },
  ratingPill: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  ratingPillSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accentSoft,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  ratingPillText: {
    color: colors.textDim,
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    textAlign: 'center',
  },
  ratingPillTextSelected: { color: colors.accentInk },
  dosesBlock: { paddingHorizontal: rhythm.screenX, paddingTop: 22 },
  dosesHead: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dosesMeta: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 12 },
  dosesEmpty: {
    borderColor: colors.borderStrong,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  dosesEmptyTitle: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 22,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  dosesEmptyCopy: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  dosesEmptyCta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dosesEmptyCtaText: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 14 },
  dosesEmptyCtaArrow: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 14 },
  doseRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    overflow: 'hidden',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  doseRowDone: { borderColor: `${colors.accent}55` },
  doseLead: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 },
  doseCopy: { flex: 1 },
  doseCheckTouch: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  doseCheck: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 28,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 28,
  },
  doseCheckFill: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  doseName: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 14 },
  doseDetail: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.7, marginTop: 3, textTransform: 'uppercase' },
  doseRight: { alignItems: 'flex-end', gap: 7 },
  doseTextButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 2 },
  doseTime: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2 },
  logDoseText: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 12, minHeight: 24 },
  removeText: { color: colors.textDim, fontFamily: fonts.sansMedium, fontSize: 11 },
  exportBlock: { paddingHorizontal: rhythm.screenX, paddingTop: 22 },
  ctaBlock: { paddingHorizontal: rhythm.screenX, paddingTop: 22 },
  btnFrame: { padding: 4, position: 'relative' },
  btn: {
    alignItems: 'center',
    backgroundColor: colors.text,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  btnText: {
    color: colors.background,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  btnArrow: { color: colors.background, fontFamily: fonts.sansMedium, fontSize: 14 },
  ctaCaption: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 0.1,
    marginTop: 14,
  },
  pressed: { opacity: 0.84 },
  quickLogClose: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  quickLogHandle: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 44,
  },
  quickLogHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickLogKicker: { ...t.eyebrow, color: colors.accent, marginBottom: 5 },
  quickLogSafe: { flex: 1, justifyContent: 'flex-end' },
  quickLogScrim: { backgroundColor: 'rgba(0,0,0,0.68)', flex: 1 },
  quickLogSheet: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderColor: colors.borderStrong,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    height: '92%',
    paddingHorizontal: 14,
    paddingTop: 14,
    width: '100%',
  },
  quickLogSheetTablet: {
    maxWidth: 720,
  },
  quickLogTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 22, letterSpacing: -0.3 },
});
