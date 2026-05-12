import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';
import { formatDoseUnit } from '@/lib/utils/reconstitution';
import { formatShortDateTime } from '@/lib/utils/trackerDates';
import type { ScheduledDosePreview } from '@/types/tracker';

interface DoseActionCardProps {
  nextDose: ScheduledDosePreview | null;
  todayTakenCount: number;
  todaySkippedCount: number;
  onLogTaken: () => void;
  onLogSkipped: () => void;
  onCreateSchedule: () => void;
}

export function DoseActionCard({
  nextDose,
  onCreateSchedule,
  onLogSkipped,
  onLogTaken,
  todaySkippedCount,
  todayTakenCount,
}: DoseActionCardProps) {
  const compound = nextDose ? compoundById[nextDose.schedule.compoundId] : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>TODAY'S TRACKER</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{todayTakenCount} taken</Text>
          {todaySkippedCount > 0 ? <Text style={styles.statusText}> · {todaySkippedCount} skipped</Text> : null}
        </View>
      </View>

      {nextDose && compound ? (
        <>
          <Text style={styles.title}>{compound.name}</Text>
          <Text style={styles.copy}>
            {nextDose.schedule.amount} {formatDoseUnit(nextDose.schedule.unit)} ·{' '}
            {formatShortDateTime(nextDose.scheduledAt)}
            {nextDose.schedule.injectionSite ? ` · ${nextDose.schedule.injectionSite}` : ''}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable onPress={onLogTaken} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Ionicons color={colors.accentInk} name="checkmark" size={17} />
              <Text style={styles.primaryText}>Log entry</Text>
            </Pressable>
            <Pressable onPress={onLogSkipped} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Skip today</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>No active tracker yet.</Text>
          <Text style={styles.copy}>
            Create one personal tracker and GlowPep becomes useful every day: next entry, one-tap logging, and history.
          </Text>
          <Pressable onPress={onCreateSchedule} style={({ pressed }) => [styles.primaryButton, styles.singleButton, pressed && styles.pressed]}>
            <Ionicons color={colors.accentInk} name="calendar-outline" size={17} />
            <Text style={styles.primaryText}>Build first tracker</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: `${colors.accent}44`,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 18,
    padding: 22,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kicker: {
    ...t.eyebrow,
    color: colors.accent,
  },
  statusPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    ...t.dataSmall,
    color: colors.textMuted,
    fontSize: 10,
  },
  title: {
    ...t.displaySmall,
    color: colors.text,
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 8,
  },
  copy: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 13,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  singleButton: {
    alignSelf: 'flex-start',
    flex: 0,
    marginTop: 20,
  },
  primaryText: {
    ...t.label,
    color: colors.accentInk,
    fontSize: 13,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryText: {
    ...t.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.82,
  },
});
