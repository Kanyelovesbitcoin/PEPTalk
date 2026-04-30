import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { RoutineSetupSheet } from '@/components/tracker/RoutineSetupSheet';
import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';
import { useTracker } from '@/lib/hooks/useTracker';
import { formatDoseAmount } from '@/lib/utils/reconstitution';
import { getScheduledDoseForDate } from '@/lib/utils/trackerDates';

const DIMENSIONS = [
  { key: 'hydration', label: 'Hydration', subtitle: 'stay dewy' },
  { key: 'texture', label: 'Smoothness', subtitle: 'smooth canvas' },
  { key: 'glow', label: 'Glow', subtitle: 'glass-skin energy' },
  { key: 'sensitivity', label: 'Sensitivity', subtitle: 'no flare today' },
] as const;

const RATING_LABELS = ['Under', 'Meh', 'Okay', 'Good', 'Glow'];

type DimKey = (typeof DIMENSIONS)[number]['key'];
type RatingState = Record<DimKey, number>;

function colorFor(value: number) {
  if (value >= 4) return colors.jade;
  if (value <= 2) return colors.crimson;
  return colors.accent;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
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

export default function LogScreen() {
  const {
    deleteSchedule,
    isReady,
    saveCheckIn,
    schedules,
    todayCheckIn,
    todayLogs,
    toggleScheduledDoseForToday,
  } = useTracker();
  const [ratings, setRatings] = useState<RatingState>({ hydration: 3, texture: 3, glow: 3, sensitivity: 3 });
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [setupScheduleId, setSetupScheduleId] = useState<string | null>(null);

  useEffect(() => {
    if (todayCheckIn) {
      setRatings({
        hydration: todayCheckIn.hydration ?? 3,
        texture: todayCheckIn.texture ?? 3,
        glow: todayCheckIn.glow ?? 3,
        sensitivity: todayCheckIn.sensitivity ?? 3,
      });
    }
  }, [todayCheckIn]);

  const activeSchedules = useMemo(
    () => schedules.filter((s) => s.active && getScheduledDoseForDate(s)).slice(0, 3),
    [schedules],
  );
  const doses = useMemo(() => {
    return activeSchedules.map((s) => {
      const compound = compoundById[s.compoundId];
      const logged = todayLogs.find((log) => log.scheduleId === s.id && log.status === 'taken');
      const hasDose = s.amount > 0;
      return {
        canLog: hasDose,
        detail: hasDose
          ? `${formatDoseAmount(s.amount, s.unit)} - ${formatRoute(String(s.administrationRoute ?? compound?.administrationRoutes[0] ?? ''))}`
          : 'Setup dose',
        done: Boolean(logged),
        id: s.id,
        name: compound?.name ?? 'Peptide',
        t: logged ? new Date(logged.takenAt ?? logged.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : s.timeLabel ?? s.timeOfDay,
      };
    });
  }, [activeSchedules, todayLogs]);

  const doneCount = doses.filter((d) => d.done).length;
  const setupSchedule = setupScheduleId ? schedules.find((schedule) => schedule.id === setupScheduleId) ?? null : null;
  const setupCompound = setupSchedule ? compoundById[setupSchedule.compoundId] ?? null : null;

  const meta = useMemo(() => {
    const now = new Date();
    return {
      day: String(now.getDate()),
      mon: now.toLocaleDateString('en-US', { month: 'short' }),
      year: String(now.getFullYear()),
      n: String(Math.floor((now.getTime() / (1000 * 60 * 60 * 24)) % 999)).padStart(3, '0'),
    };
  }, []);

  const handleSave = () => {
    saveCheckIn({
      date: todayDate(),
      hydration: ratings.hydration,
      texture: ratings.texture,
      glow: ratings.glow,
      sensitivity: ratings.sensitivity,
    });
    setSavedAt(Date.now());
    setTimeout(() => router.push('/(tabs)'), 600);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Masthead */}
        <View style={styles.masthead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>
              <Text style={styles.eyebrowDot}>● </Text>Daily check-in
            </Text>
            <Text style={styles.title}>
              How does it{'\n'}
              <Text style={styles.titleAccent}>feel today?</Text>
            </Text>
            <Text style={styles.titleFlair}>Glow-metric logging.</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.dateNum}>{meta.day}</Text>
            <Text style={styles.dateMeta}>{meta.mon} {meta.year}</Text>
          </View>
        </View>
        <View style={styles.ruleBold} />

        {/* Skin dimensions */}
        {DIMENSIONS.map((dim, i, arr) => {
          const value = ratings[dim.key];
          const color = colorFor(value);
          return (
            <View
              key={dim.key}
              style={[styles.dimBlock, i < arr.length - 1 && styles.dimDivider]}>
              <View style={styles.dimHead}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.dimNum}>{String(i + 1).padStart(2, '0')} ·</Text>
                  <Text style={styles.dimLabel}>{dim.label}</Text>
                </View>
                <Text style={[styles.dimValue, { color }]}>{RATING_LABELS[value - 1]}</Text>
              </View>
              <Text style={styles.dimSubtitle}>— {dim.subtitle}</Text>
              <View style={styles.tracksRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setRatings((s) => ({ ...s, [dim.key]: n }))}
                    style={styles.trackTouch}>
                    <View
                      style={[
                        styles.trackBar,
                        n === value
                          ? { height: 4, backgroundColor: color }
                          : { height: 2, backgroundColor: colors.borderStrong },
                      ]}
                    />
                    <Text
                      style={[
                        styles.trackNum,
                        n === value && { color: colors.text, fontFamily: fonts.monoMedium },
                      ]}>
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
        <View style={styles.ruleBold} />

        {/* Tracking */}
        <View style={styles.dosesBlock}>
          <View style={styles.dosesHead}>
            <Text style={styles.sectionLabel}>Your routine today</Text>
            {doses.length > 0 && (
              <Text style={styles.dosesMeta}>
                {doneCount} of {doses.length}
              </Text>
            )}
          </View>
          {doses.length === 0 ? (
            <Pressable onPress={() => router.push('/(tabs)/library')} style={styles.dosesEmpty}>
              <Text style={styles.dosesEmptyTitle}>Nothing in your routine yet.</Text>
              <Text style={styles.dosesEmptyCopy}>
                Browse the library and tap “Add to my routine.” It will appear here when you are ready to log it.
              </Text>
              <View style={styles.dosesEmptyCta}>
                <Text style={styles.dosesEmptyCtaText}>Open library</Text>
                <Text style={styles.dosesEmptyCtaArrow}>→</Text>
              </View>
            </Pressable>
          ) : (
            doses.map((d, i, arr) => (
              <View
                key={d.id}
                style={[styles.doseRow, i < arr.length - 1 && styles.doseRowDivider]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <Pressable
                    disabled={!isReady}
                    onPress={() => (d.canLog ? toggleScheduledDoseForToday(d.id) : setSetupScheduleId(d.id))}
                    style={[
                      styles.doseCheck,
                      {
                        backgroundColor: d.done ? colors.accent : 'transparent',
                        borderColor: d.done ? colors.accent : colors.borderStrong,
                      },
                    ]}>
                    {d.done && <Text style={styles.doseCheckMark}>✓</Text>}
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.doseName,
                        !d.done && { color: colors.textMuted },
                      ]}>
                      {d.name}
                    </Text>
                    <Text style={styles.doseDetail}>{d.detail}</Text>
                  </View>
                </View>
                <View style={styles.doseRight}>
                  <Text style={[styles.doseTime, { color: d.done ? colors.accent : colors.textDim }]}>
                    {d.t}
                  </Text>
                  {d.canLog ? (
                    d.done ? (
                      <View style={styles.loggedActions}>
                        <AnimatedLogged />
                        <Pressable onPress={() => toggleScheduledDoseForToday(d.id)} hitSlop={8}>
                          <Text style={styles.removeText}>Undo</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable disabled={!isReady} hitSlop={8} onPress={() => toggleScheduledDoseForToday(d.id)}>
                        <Text style={styles.logDoseText}>Log today</Text>
                      </Pressable>
                    )
                  ) : (
                    <Pressable disabled={!isReady} hitSlop={8} onPress={() => setSetupScheduleId(d.id)}>
                      <Text style={styles.logDoseText}>Setup</Text>
                    </Pressable>
                  )}
                  {!d.done && (
                    <Pressable onPress={() => deleteSchedule(d.id)} hitSlop={8}>
                      <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Save */}
        <View style={styles.ctaBlock}>
          <Pressable onPress={handleSave} style={styles.btn}>
            <Text style={styles.btnText}>{savedAt ? 'Saved' : 'Save check-in'}</Text>
            <Text style={styles.btnArrow}>→</Text>
          </Pressable>
          <Text style={styles.ctaCaption}>Saved privately on this device. Consistency is compounding.</Text>
        </View>
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

function AnimatedLogged() {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  }, [scale]);

  return (
    <Animated.View style={[styles.loggedBadge, { transform: [{ scale }] }]}>
      <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
      <Text style={[styles.logDoseText, { color: colors.accent }]}>Logged</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  scroll: { paddingBottom: 140 },

  masthead: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
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
    lineHeight: 40,
    letterSpacing: -1.4,
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

  ruleBold: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },

  dimBlock: { paddingHorizontal: 22, paddingVertical: 22 },
  dimDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  dimHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  dimNum: { color: colors.textDim, fontFamily: fonts.sansMedium, fontSize: 11 },
  dimLabel: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 22, letterSpacing: -0.6, marginLeft: 8 },
  dimValue: { fontFamily: fonts.sansMedium, fontSize: 14 },
  dimSubtitle: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 0.2,
    marginBottom: 16,
  },

  tracksRow: { flexDirection: 'row', gap: 6 },
  trackTouch: { flex: 1, paddingTop: 14 },
  trackBar: { width: '100%' },
  trackNum: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 11,
    marginTop: 8,
  },

  dosesBlock: { paddingHorizontal: 22, paddingTop: 22 },
  dosesHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  dosesMeta: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 12 },

  dosesEmpty: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderColor: colors.borderStrong,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dosesEmptyCtaText: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 14 },
  dosesEmptyCtaArrow: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 14 },

  doseRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doseRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  doseCheck: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseCheckMark: { color: colors.background, fontSize: 11, fontFamily: fonts.sansMedium },
  doseName: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 14 },
  doseDetail: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.7, marginTop: 3, textTransform: 'uppercase' },
  doseRight: { alignItems: 'flex-end', gap: 7 },
  doseTime: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.2 },
  logDoseText: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 12 },
  removeText: { color: colors.textDim, fontFamily: fonts.sansMedium, fontSize: 11 },
  loggedActions: { alignItems: 'flex-end', gap: 6 },
  loggedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  ctaBlock: { paddingHorizontal: 22, paddingTop: 22 },
  btn: {
    height: 56,
    backgroundColor: colors.text,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: 14,
    letterSpacing: 0.1,
  },
});
