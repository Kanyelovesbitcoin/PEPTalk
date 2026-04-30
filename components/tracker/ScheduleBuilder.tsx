import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import { compounds } from '@/lib/data/compounds';
import { useTracker } from '@/lib/hooks/useTracker';
import { formatDoseUnit } from '@/lib/utils/reconstitution';
import { formatShortDateTime, getNextScheduledDose } from '@/lib/utils/trackerDates';
import type { DoseUnit, ScheduleFrequency } from '@/types/tracker';

const units: DoseUnit[] = ['mcg', 'mg', 'iu'];
const frequencies: Array<{ label: string; value: ScheduleFrequency }> = [
  { label: 'Daily', value: 'daily' },
  { label: 'EOD', value: 'eod' },
  { label: 'Custom', value: 'custom-days' },
];
const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function ScheduleBuilder() {
  const { addSchedule, deleteSchedule, schedules, toggleSchedule } = useTracker();
  const [compoundId, setCompoundId] = useState(compounds[0]?.id ?? '');
  const [amount, setAmount] = useState('250');
  const [unit, setUnit] = useState<DoseUnit>('mcg');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 3, 5]);
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [startDate, setStartDate] = useState(todayKey());
  const [injectionSite, setInjectionSite] = useState('Abdomen');
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  function saveSchedule() {
    if (!compoundId || Number(amount) <= 0) {
      return;
    }

    addSchedule({
      active: true,
      amount: Number(amount),
      compoundId,
      customDays: frequency === 'custom-days' ? customDays : undefined,
      frequency,
      injectionSite: injectionSite.trim() || undefined,
      remindersEnabled,
      startDate,
      timeOfDay,
      unit,
    });
  }

  function toggleDay(dayIndex: number) {
    setCustomDays((current) =>
      current.includes(dayIndex) ? current.filter((day) => day !== dayIndex) : [...current, dayIndex].sort(),
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>SCHEDULE</Text>
      <Text style={styles.title}>Make it repeatable.</Text>

      <Text style={styles.label}>Compound</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller}>
        {compounds.map((compound) => {
          const selected = compound.id === compoundId;
          return (
            <Pressable key={compound.id} onPress={() => setCompoundId(compound.id)} style={[styles.chip, selected && styles.chipOn]}>
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{compound.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.row}>
        <View style={styles.flexField}>
          <Text style={styles.label}>Amount</Text>
          <TextInput keyboardType="decimal-pad" onChangeText={setAmount} style={styles.input} value={amount} />
        </View>
        <View style={styles.flexField}>
          <Text style={styles.label}>Unit</Text>
          <View style={styles.segmentRow}>
            {units.map((item) => (
              <Pressable key={item} onPress={() => setUnit(item)} style={[styles.segment, unit === item && styles.segmentOn]}>
                <Text style={[styles.segmentText, unit === item && styles.segmentTextOn]}>{formatDoseUnit(item)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.label}>Frequency</Text>
      <View style={styles.segmentRow}>
        {frequencies.map((item) => (
          <Pressable key={item.value} onPress={() => setFrequency(item.value)} style={[styles.segment, frequency === item.value && styles.segmentOn]}>
            <Text style={[styles.segmentText, frequency === item.value && styles.segmentTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {frequency === 'custom-days' ? (
        <View style={styles.dayRow}>
          {days.map((day, index) => (
            <Pressable key={`${day}-${index}`} onPress={() => toggleDay(index)} style={[styles.dayChip, customDays.includes(index) && styles.dayChipOn]}>
              <Text style={[styles.dayText, customDays.includes(index) && styles.dayTextOn]}>{day}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.flexField}>
          <Text style={styles.label}>Time</Text>
          <TextInput onChangeText={setTimeOfDay} placeholder="09:00" placeholderTextColor={colors.textFaint} style={styles.input} value={timeOfDay} />
        </View>
        <View style={styles.flexField}>
          <Text style={styles.label}>Start date</Text>
          <TextInput onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textFaint} style={styles.input} value={startDate} />
        </View>
      </View>

      <Text style={styles.label}>Site default</Text>
      <TextInput onChangeText={setInjectionSite} placeholder="Abdomen, thigh, glute..." placeholderTextColor={colors.textFaint} style={styles.input} value={injectionSite} />

      <Pressable onPress={() => setRemindersEnabled((value) => !value)} style={({ pressed }) => [styles.reminderBox, remindersEnabled && styles.reminderBoxOn, pressed && styles.pressed]}>
        <View style={styles.reminderTextWrap}>
          <Text style={[styles.reminderTitle, remindersEnabled && styles.reminderTitleOn]}>Private reminder</Text>
          <Text style={[styles.reminderCopy, remindersEnabled && styles.reminderCopyOn]}>
            Generic lock-screen prompt. No compound name or dose shown.
          </Text>
        </View>
        <Text style={[styles.reminderState, remindersEnabled && styles.reminderStateOn]}>{remindersEnabled ? 'ON' : 'OFF'}</Text>
      </Pressable>

      <Pressable onPress={saveSchedule} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Save schedule</Text>
      </Pressable>

      {schedules.length > 0 ? (
        <View style={styles.savedWrap}>
          <Text style={styles.savedTitle}>Active protocols</Text>
          {schedules.slice(0, 4).map((schedule) => {
            const compound = compounds.find((item) => item.id === schedule.compoundId);
            const preview = getNextScheduledDose(schedule);
            return (
              <View key={schedule.id} style={styles.scheduleRow}>
                <View style={styles.scheduleTextWrap}>
                  <Text style={styles.scheduleName}>{compound?.name ?? 'Compound'} · {schedule.amount}{formatDoseUnit(schedule.unit)}</Text>
                  <Text style={styles.scheduleMeta}>
                    {preview ? `Next ${formatShortDateTime(preview.scheduledAt)}` : 'Paused'} · {schedule.remindersEnabled ? 'reminders on' : 'reminders off'}
                  </Text>
                </View>
                <View style={styles.scheduleActions}>
                  <Pressable onPress={() => toggleSchedule(schedule.id)} style={styles.miniButton}>
                    <Text style={styles.miniButtonText}>{schedule.active ? 'Pause' : 'Run'}</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteSchedule(schedule.id)} style={[styles.miniButton, styles.deleteButton]}>
                    <Text style={[styles.miniButtonText, styles.deleteText]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16, padding: 18 },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 8 },
  title: { ...t.displaySmall, color: colors.text, fontSize: 23, lineHeight: 27, marginBottom: 16 },
  label: { ...t.eyebrow, color: colors.textDim, marginBottom: 8, marginTop: 10 },
  chipScroller: { marginBottom: 4 },
  chip: { backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, marginRight: 8, paddingHorizontal: 13, paddingVertical: 9 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...t.label, color: colors.textMuted, fontSize: 12 },
  chipTextOn: { color: colors.accentInk },
  row: { flexDirection: 'row', gap: 12 },
  flexField: { flex: 1 },
  input: { ...t.bodySmall, backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, color: colors.text, paddingHorizontal: 13, paddingVertical: 12 },
  segmentRow: { flexDirection: 'row', gap: 7 },
  segment: { alignItems: 'center', backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flex: 1, paddingVertical: 12 },
  segmentOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmentText: { ...t.label, color: colors.textMuted, fontSize: 10, textTransform: 'uppercase' },
  segmentTextOn: { color: colors.accentInk },
  dayRow: { flexDirection: 'row', gap: 7, marginTop: 12 },
  dayChip: { alignItems: 'center', backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flex: 1, paddingVertical: 9 },
  dayChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayText: { ...t.dataSmall, color: colors.textMuted },
  dayTextOn: { color: colors.accentInk },
  button: { backgroundColor: colors.accent, borderRadius: 13, marginTop: 18, paddingVertical: 14 },
  buttonText: { ...t.label, color: colors.accentInk, textAlign: 'center' },
  reminderBox: { alignItems: 'center', backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginTop: 16, padding: 14 },
  reminderBoxOn: { borderColor: `${colors.accent}77` },
  reminderTextWrap: { flex: 1 },
  reminderTitle: { ...t.label, color: colors.text, fontSize: 13, marginBottom: 4 },
  reminderTitleOn: { color: colors.accent },
  reminderCopy: { ...t.bodySmall, color: colors.textDim, fontSize: 12, lineHeight: 17 },
  reminderCopyOn: { color: colors.textMuted },
  reminderState: { ...t.dataSmall, color: colors.textFaint },
  reminderStateOn: { color: colors.accent },
  savedWrap: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 18, paddingTop: 14 },
  savedTitle: { ...t.eyebrow, color: colors.textDim, marginBottom: 10 },
  scheduleRow: { borderColor: colors.border, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 12 },
  scheduleTextWrap: { flex: 1 },
  scheduleName: { ...t.label, color: colors.text, fontSize: 12 },
  scheduleMeta: { ...t.bodySmall, color: colors.textMuted, marginTop: 3 },
  scheduleActions: { gap: 6 },
  miniButton: { alignItems: 'center', backgroundColor: colors.backgroundAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  miniButtonText: { ...t.dataSmall, color: colors.textMuted },
  deleteButton: { backgroundColor: `${colors.danger}18` },
  deleteText: { color: colors.danger },
  pressed: { opacity: 0.82 },
});
