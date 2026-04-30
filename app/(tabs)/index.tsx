import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkinMetricRow } from '@/components/glow/SkinMetricRow';
import { RoutineSetupSheet } from '@/components/tracker/RoutineSetupSheet';
import { colors } from '@/lib/constants/colors';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { fonts, type as t } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';
import { useTracker } from '@/lib/hooks/useTracker';
import { getSkinScans, type SkinScan } from '@/lib/storage/skinScans';
import { looksROIFromScores } from '@/lib/utils/skinAnalysis';
import { storage } from '@/lib/utils/storage';
import { formatDoseAmount } from '@/lib/utils/reconstitution';
import { getScheduledDoseForDate } from '@/lib/utils/trackerDates';

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function averageScan(scan: SkinScan) {
  return Math.round((scan.collagen + scan.texture + scan.luminosity) / 3);
}

function scanDelta(scans: SkinScan[]) {
  if (scans.length < 2) return null;
  return averageScan(scans[0]) - averageScan(scans[1]);
}

const ROUTE_LABELS: Record<string, string> = {
  injection: 'Injection',
  nasal: 'Nasal',
  oral: 'Oral',
  sublingual: 'Sublingual',
  topical: 'Topical',
};

function formatRoute(route?: string) {
  return route ? ROUTE_LABELS[route] ?? route : 'Route not set';
}

export default function TodayScreen() {
  const { checkIns, schedules, todayCheckIn, todayLogs } = useTracker();
  const [profileName, setProfileName] = useState('');
  const [scans, setScans] = useState<SkinScan[]>([]);
  const [setupScheduleId, setSetupScheduleId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([storage.getItem(STORAGE_KEYS.profileName), getSkinScans()]).then(([name, storedScans]) => {
        if (!active) return;
        setProfileName(name ?? '');
        setScans(storedScans);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const activeSchedules = useMemo(() => schedules.filter((schedule) => schedule.active), [schedules]);
  const todaySchedules = useMemo(
    () => activeSchedules.filter((schedule) => getScheduledDoseForDate(schedule)),
    [activeSchedules],
  );
  const latestScan = scans[0] ?? null;
  const delta = scanDelta(scans);
  const roi = latestScan ? looksROIFromScores(latestScan) : null;
  const completedToday = todaySchedules.filter((schedule) =>
    todayLogs.some((log) => log.scheduleId === schedule.id && log.status === 'taken'),
  ).length;
  const setupSchedule = setupScheduleId ? schedules.find((schedule) => schedule.id === setupScheduleId) ?? null : null;
  const setupCompound = setupSchedule ? compoundById[setupSchedule.compoundId] ?? null : null;

  const trackedItems = useMemo(
    () =>
      activeSchedules.slice(0, 4).map((schedule) => {
        const compound = compoundById[schedule.compoundId];
        const hasDose = schedule.amount > 0;
        const logged = todayLogs.some((log) => log.scheduleId === schedule.id && log.status === 'taken');
        return {
          canLog: hasDose,
          dose: formatDoseAmount(schedule.amount, schedule.unit),
          id: schedule.id,
          name: compound?.name ?? 'Peptide',
          route: formatRoute(String(schedule.administrationRoute ?? compound?.administrationRoutes[0] ?? '')),
          logged,
        };
      }),
    [activeSchedules, todayLogs],
  );

  const nextStep = useMemo(() => {
    if (!latestScan) return { label: 'Run your first scan', route: '/scan' as const };
    if (activeSchedules.length === 0) return { label: 'Choose something to track', route: '/(tabs)/library' as const };
    if (!todayCheckIn) return { label: 'Log today\'s check-in', route: '/(tabs)/tracker' as const };
    return { label: 'Review your stack', route: '/(tabs)/ai' as const };
  }, [activeSchedules.length, latestScan, todayCheckIn]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.masthead}>
          <View>
            <Text style={styles.brand}>GlowPep</Text>
            <Text style={styles.date}>{todayLabel()}</Text>
          </View>
          <Pressable onPress={() => router.push('/profile-modal')} style={styles.iconBtn}>
            <Ionicons color={colors.textMuted} name="person-outline" size={16} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>YOUR ROUTINE</Text>
          <Text style={styles.title}>{profileName ? `${profileName}'s ` : ''}wellness tracker</Text>
          <Text style={styles.subtitle}>Track what you use, scan your skin, and see what's actually working.</Text>
        </View>

        <View style={styles.statGrid}>
          <StatTile label="Tracked" value={String(activeSchedules.length)} note="peptides" />
          <StatTile label="Logged" value={`${completedToday}/${todaySchedules.length || 0}`} note="today" />
          <StatTile label="Scan" value={latestScan ? String(averageScan(latestScan)) : '—'} note={delta === null ? 'baseline' : `${delta > 0 ? '+' : ''}${delta} change`} />
        </View>

        <SectionHeader label="SKIN SCAN" title="Latest skin snapshot" />
        {latestScan ? (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>Your skinmaxx baseline</Text>
                <Text style={styles.cardMeta}>{new Date(latestScan.takenAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.roiBadge}>
                <Text style={styles.roiValue}>{roi}</Text>
                <Text style={styles.roiLabel}>GLOW SCORE</Text>
              </View>
            </View>
            <SkinMetricRow
              description="How tight, fresh, and youthful your skin reads at a glance."
              label="Youthful Bounce"
              value={latestScan.collagen}
            />
            <SkinMetricRow
              description="How even the skin surface looks: fewer bumps, rough spots, or visible unevenness."
              label="Smooth Canvas"
              value={latestScan.texture}
            />
            <SkinMetricRow
              description="How bright, awake, and camera-ready your skin looks in this scan."
              label="Glow Factor"
              value={latestScan.luminosity}
            />
            <Pressable onPress={() => router.push('/scan')} style={styles.textCta}>
              <Text style={styles.textCtaText}>Scan again</Text>
              <Ionicons color={colors.accent} name="arrow-forward" size={16} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/scan')} style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No scan yet.</Text>
            <Text style={styles.emptyCopy}>Take a selfie scan to create your first cosmetic baseline.</Text>
            <Text style={styles.emptyAction}>Start scan →</Text>
          </Pressable>
        )}

        <SectionHeader label="YOUR ROUTINE" title="What you're tracking" />
        {trackedItems.length > 0 ? (
          <View style={styles.listCard}>
            {trackedItems.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => (!item.canLog ? setSetupScheduleId(item.id) : router.push('/(tabs)/tracker'))}
                style={[styles.trackRow, index < trackedItems.length - 1 && styles.trackRowBorder]}>
                <View style={styles.trackMark}>
                  <Ionicons color={item.logged ? colors.accentInk : colors.accent} name={item.logged ? 'checkmark' : item.canLog ? 'ellipse-outline' : 'create-outline'} size={16} />
                </View>
                <View style={styles.trackBody}>
                  <Text style={styles.trackName}>{item.name}</Text>
                  <Text style={styles.trackMeta}>{item.route} - {item.dose}</Text>
                </View>
                <Text style={[styles.trackStatus, item.logged && styles.trackStatusDone]}>{item.logged ? 'Done' : item.canLog ? 'To do' : 'Setup'}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Pressable onPress={() => router.push('/(tabs)/library')} style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nothing tracked yet.</Text>
            <Text style={styles.emptyCopy}>Open the library and tap “I want to track this” on any peptide you actually use.</Text>
            <Text style={styles.emptyAction}>Open library →</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.push(nextStep.route)} style={styles.primaryCta}>
          <Text style={styles.primaryCtaText}>{nextStep.label}</Text>
          <Ionicons color={colors.accentInk} name="arrow-forward" size={18} />
        </Pressable>

        <Text style={styles.footnote}>GlowPep is for cosmetic and educational tracking only. It does not provide medical advice.</Text>
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
    <View style={styles.sectionHead}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function StatTile({ label, note, value }: { label: string; note: string; value: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (displayValue !== value) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.15, useNativeDriver: true, speed: 20 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 })
      ]).start();
      setDisplayValue(value);
    }
  }, [value, displayValue, scale]);

  return (
    <View style={styles.statTile}>
      <Animated.Text style={[styles.statValue, { transform: [{ scale }] }]} numberOfLines={1}>{displayValue}</Animated.Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statNote}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  scroll: { paddingBottom: 150, paddingHorizontal: 20, paddingTop: 12 },
  masthead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 26 },
  brand: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 26, letterSpacing: -0.5 },
  date: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.1, marginTop: 4, textTransform: 'uppercase' },
  iconBtn: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, height: 44, justifyContent: 'center', width: 44 },
  hero: { marginBottom: 22 },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 10 },
  title: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 39, letterSpacing: -1.3, lineHeight: 42, maxWidth: 320 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 330 },
  statGrid: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  statTile: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flex: 1, minHeight: 112, padding: 14 },
  statValue: { color: colors.accentSoft, fontFamily: fonts.serifLight, fontSize: 34, letterSpacing: -1, lineHeight: 38, marginBottom: 8 },
  statLabel: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 13 },
  statNote: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, marginTop: 4, textTransform: 'uppercase' },
  sectionHead: { marginBottom: 12, marginTop: 2 },
  sectionLabel: { ...t.eyebrow, color: colors.accent, marginBottom: 6 },
  sectionTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 18, letterSpacing: -0.2 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginBottom: 30, padding: 18 },
  cardHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  cardTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 18 },
  cardMeta: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, marginTop: 4, textTransform: 'uppercase' },
  roiBadge: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, minWidth: 72, paddingHorizontal: 10, paddingVertical: 8 },
  roiValue: { color: colors.accentSoft, fontFamily: fonts.serifLight, fontSize: 24, lineHeight: 26 },
  roiLabel: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 8, letterSpacing: 0.8, marginTop: 2 },
  textCta: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 4, minHeight: 44 },
  textCtaText: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 15 },
  emptyCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginBottom: 30, padding: 20 },
  emptyTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 18, marginBottom: 8 },
  emptyCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  emptyAction: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 15 },
  listCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginBottom: 28, overflow: 'hidden' },
  trackRow: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 72, paddingHorizontal: 16, paddingVertical: 12 },
  trackRowBorder: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  trackMark: { alignItems: 'center', backgroundColor: colors.backgroundAlt, borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
  trackBody: { flex: 1 },
  trackName: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 15 },
  trackMeta: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 12, marginTop: 4 },
  trackStatus: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  trackStatusDone: { color: colors.accent },
  primaryCta: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: 18 },
  primaryCtaText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 15 },
  footnote: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: 'center' },
});
