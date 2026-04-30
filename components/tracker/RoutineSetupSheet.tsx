import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';
import { useTracker } from '@/lib/hooks/useTracker';
import { formatDoseUnit } from '@/lib/utils/reconstitution';
import type { AdministrationRoute, Compound } from '@/types/compound';
import type { DoseSchedule, DoseUnit } from '@/types/tracker';

const UNIT_OPTIONS: DoseUnit[] = ['mcg', 'mg', 'iu', 'pump', 'drop', 'spray', 'capsule', 'application'];

const ROUTE_LABELS: Record<AdministrationRoute | string, string> = {
  injection: 'Injection',
  nasal: 'Nasal',
  oral: 'Oral',
  sublingual: 'Sublingual',
  topical: 'Topical',
};

type TimePreset = 'morning' | 'night' | 'custom';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function defaultUnit(route: AdministrationRoute | string, compound?: Compound | null): DoseUnit {
  if (route === 'topical') return 'pump';
  if (route === 'nasal') return 'spray';
  if (route === 'oral') return 'capsule';
  if (route === 'sublingual') return 'drop';
  
  if (compound?.id === 'tb-500' || compound?.id === 'epitalon') return 'mg';
  
  return 'mcg';
}

function defaultAmount(route: AdministrationRoute | string) {
  if (route === 'topical') return '2';
  if (route === 'injection') return '250';
  return '1';
}

function presetForSchedule(schedule?: DoseSchedule | null): TimePreset {
  if (schedule?.timeLabel === 'Morning' || schedule?.timeOfDay === '08:00') return 'morning';
  if (schedule?.timeLabel === 'Night' || schedule?.timeOfDay === '21:00') return 'night';
  return 'custom';
}

function timeForPreset(preset: TimePreset, customTime: string) {
  if (preset === 'morning') return '08:00';
  if (preset === 'night') return '21:00';
  return customTime;
}

function labelForPreset(preset: TimePreset, customTime: string) {
  if (preset === 'morning') return 'Morning';
  if (preset === 'night') return 'Night';
  return customTime;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

interface RoutineSetupSheetProps {
  compound: Compound | null;
  existingSchedule?: DoseSchedule | null;
  onClose: () => void;
  onSaved?: () => void;
  visible: boolean;
}

export function RoutineSetupSheet({
  compound,
  existingSchedule,
  onClose,
  onSaved,
  visible,
}: RoutineSetupSheetProps) {
  const { addSchedule, isReady, updateSchedule } = useTracker();
  const routeOptions = useMemo(() => {
    if (!compound) return [];
    const existingRoute = existingSchedule?.administrationRoute;
    const options = [...compound.administrationRoutes];
    if (existingRoute && !options.includes(existingRoute as AdministrationRoute)) {
      options.unshift(existingRoute as AdministrationRoute);
    }
    return options;
  }, [compound, existingSchedule?.administrationRoute]);

  const initialRoute = existingSchedule?.administrationRoute ?? routeOptions[0] ?? 'topical';
  const [route, setRoute] = useState<AdministrationRoute | string>(initialRoute);
  const [amount, setAmount] = useState(defaultAmount(initialRoute));
  const [unit, setUnit] = useState<DoseUnit>(defaultUnit(initialRoute, compound));
  const [timePreset, setTimePreset] = useState<TimePreset>('morning');
  const [customTime, setCustomTime] = useState('08:00');
  const [injectionSite, setInjectionSite] = useState('Abdomen');
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  useEffect(() => {
    if (!visible || !compound) return;

    const nextRoute = existingSchedule?.administrationRoute ?? compound.administrationRoutes[0] ?? 'topical';
    const nextPreset = presetForSchedule(existingSchedule);
    setRoute(nextRoute);
    setAmount(existingSchedule && existingSchedule.amount > 0 ? String(existingSchedule.amount) : defaultAmount(nextRoute));
    setUnit(existingSchedule?.unit ?? defaultUnit(nextRoute, compound));
    setTimePreset(nextPreset);
    setCustomTime(existingSchedule?.timeOfDay ?? timeForPreset(nextPreset, '08:00'));
    setInjectionSite(existingSchedule?.injectionSite ?? 'Abdomen');
  }, [compound, existingSchedule, visible]);

  function selectRoute(nextRoute: AdministrationRoute | string) {
    setRoute(nextRoute);
    if (!existingSchedule || existingSchedule.amount <= 0) {
      setAmount(defaultAmount(nextRoute));
      setUnit(defaultUnit(nextRoute, compound));
    }
  }

  const timeOfDay = timeForPreset(timePreset, customTime.trim());
  const amountNumber = Number(amount);
  const canSave = Boolean(compound && isReady && amountNumber > 0 && route && isValidTime(timeOfDay) && safetyConfirmed);
  const isInjection = route === 'injection';
  const isEditing = Boolean(existingSchedule);

  function saveRoutine() {
    if (!compound || !canSave) return;

    const schedule = {
      active: true,
      administrationRoute: route,
      amount: amountNumber,
      compoundId: compound.id,
      frequency: 'daily' as const,
      injectionSite: isInjection ? injectionSite.trim() || undefined : undefined,
      remindersEnabled: false,
      startDate: existingSchedule?.startDate ?? todayKey(),
      timeLabel: labelForPreset(timePreset, timeOfDay),
      timeOfDay,
      unit,
    };

    if (existingSchedule) {
      updateSchedule(existingSchedule.id, schedule);
    } else {
      addSchedule(schedule);
    }

    onSaved?.();
    onClose();
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.scrim}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.kicker}>{isEditing ? 'SETUP DOSE' : 'ADD TO ROUTINE'}</Text>
                <Text style={styles.title}>{compound?.name ?? 'Routine dose'}</Text>
              </View>
              <Pressable accessibilityRole="button" hitSlop={12} onPress={onClose} style={styles.closeButton}>
                <Ionicons color={colors.textMuted} name="close" size={20} />
              </Pressable>
            </View>

            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountRow}>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setAmount}
                placeholder="250"
                placeholderTextColor={colors.textFaint}
                style={styles.amountInput}
                value={amount}
              />
              <View style={styles.unitWrap}>
                {UNIT_OPTIONS.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setUnit(item)}
                    style={[styles.unitChip, unit === item && styles.unitChipOn]}>
                    <Text style={[styles.unitText, unit === item && styles.unitTextOn]}>
                      {formatDoseUnit(item)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Text style={styles.label}>Route</Text>
            <View style={styles.routeRow}>
              {routeOptions.map((item) => {
                const selected = route === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => selectRoute(item)}
                    style={[styles.routeChip, selected && styles.routeChipOn]}>
                    <Text style={[styles.routeText, selected && styles.routeTextOn]}>
                      {ROUTE_LABELS[item] ?? item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isInjection ? (
              <>
                <Text style={styles.label}>Site</Text>
                <TextInput
                  onChangeText={setInjectionSite}
                  placeholder="Abdomen, thigh, glute..."
                  placeholderTextColor={colors.textFaint}
                  style={styles.textInput}
                  value={injectionSite}
                />
              </>
            ) : null}

            <Text style={styles.label}>Time</Text>
            <View style={styles.timeRow}>
              {(['morning', 'night', 'custom'] as TimePreset[]).map((item) => {
                const selected = timePreset === item;
                const label = item === 'morning' ? 'Morning' : item === 'night' ? 'Night' : 'Custom';
                return (
                  <Pressable
                    key={item}
                    onPress={() => setTimePreset(item)}
                    style={[styles.timeChip, selected && styles.timeChipOn]}>
                    <Text style={[styles.timeText, selected && styles.timeTextOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {timePreset === 'custom' ? (
              <TextInput
                onChangeText={setCustomTime}
                placeholder="08:00"
                placeholderTextColor={colors.textFaint}
                style={[styles.textInput, styles.customTimeInput]}
                value={customTime}
              />
            ) : null}

            <Pressable onPress={() => setSafetyConfirmed((s) => !s)} style={styles.safetyRow}>
              <View style={[styles.checkbox, safetyConfirmed && styles.checkboxOn]}>
                {safetyConfirmed && <Ionicons name="checkmark" size={14} color={colors.background} />}
              </View>
              <Text style={styles.safetyText}>I understand this is for educational tracking and not medical advice.</Text>
            </Pressable>

            <Pressable
              disabled={!canSave}
              onPress={saveRoutine}
              style={({ pressed }) => [styles.saveButton, !canSave && styles.saveButtonDisabled, pressed && styles.pressed]}>
              <Text style={styles.saveText}>{isEditing ? 'Save dose' : 'Add routine dose'}</Text>
              <Ionicons color={colors.accentInk} name="checkmark" size={18} />
            </Pressable>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  amountInput: {
    ...t.displaySmall,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    flex: 0.38,
    fontSize: 28,
    minHeight: 74,
    paddingHorizontal: 16,
  },
  amountRow: { flexDirection: 'row', gap: 12 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  customTimeInput: { marginTop: 10 },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 44,
  },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  headerCopy: { flex: 1, paddingRight: 14 },
  keyboard: { flex: 1, justifyContent: 'flex-end' },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 6 },
  label: { ...t.eyebrow, color: colors.textDim, marginBottom: 9, marginTop: 16 },
  pressed: { opacity: 0.82 },
  routeChip: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  routeChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  routeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  routeText: { ...t.label, color: colors.textMuted, fontSize: 12 },
  routeTextOn: { color: colors.accentInk },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, paddingHorizontal: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  safetyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, flex: 1 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 22,
    paddingVertical: 15,
  },
  saveButtonDisabled: { opacity: 0.42 },
  saveText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 14 },
  scrim: { backgroundColor: 'rgba(0,0,0,0.62)', flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  textInput: {
    ...t.bodySmall,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  timeChip: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingVertical: 12,
  },
  timeChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  timeRow: { flexDirection: 'row', gap: 8 },
  timeText: { ...t.label, color: colors.textMuted, fontSize: 12 },
  timeTextOn: { color: colors.accentInk },
  title: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 22, letterSpacing: -0.3 },
  unitChip: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  unitChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  unitText: { ...t.dataSmall, color: colors.textMuted },
  unitTextOn: { color: colors.accentInk },
  unitWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
});
