import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess';
import { useAdaptiveLayout } from '@/lib/hooks/useAdaptiveLayout';
import { usePro } from '@/lib/hooks/usePro';
import { useTracker } from '@/lib/hooks/useTracker';
import { showPaywallWithAlert } from '@/lib/utils/paywallAlerts';
import { hapticLight } from '@/lib/utils/haptics';
import { sanitizeDecimalInput } from '@/lib/utils/numberInput';
import { formatDoseUnit } from '@/lib/utils/reconstitution';
import type { AdministrationRoute, Compound } from '@/types/compound';
import type { DoseSchedule, DoseUnit } from '@/types/tracker';

const UNIT_OPTIONS: DoseUnit[] = ['mcg', 'mg', 'iu', 'pump', 'drop', 'spray', 'capsule', 'application'];
const SUCCESS_DELAY_MS = 650;

const ROUTE_LABELS: Record<AdministrationRoute | string, string> = {
  injection: 'Non-oral',
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

function defaultAmount() {
  return '';
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

function newestScheduleForCompound(schedules: DoseSchedule[], compoundId?: string) {
  if (!compoundId) return null;

  return schedules
    .filter((schedule) => schedule.compoundId === compoundId)
    .sort((left, right) => {
      const leftTime = left.updatedAt ?? left.createdAt;
      const rightTime = right.updatedAt ?? right.createdAt;
      return rightTime.localeCompare(leftTime);
    })[0] ?? null;
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
  const layout = useAdaptiveLayout();
  const { addSchedule, isReady, schedules, updateSchedule } = useTracker();
  const { isPro, showPaywall } = usePro();
  const reminderAccess = useFeatureAccess('privateReminders');
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
  const [amount, setAmount] = useState(defaultAmount());
  const [unit, setUnit] = useState<DoseUnit>(defaultUnit(initialRoute, compound));
  const [timePreset, setTimePreset] = useState<TimePreset>('morning');
  const [customTime, setCustomTime] = useState('08:00');
  const [injectionSite, setInjectionSite] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible || !compound) return;

    const prefillSchedule = existingSchedule ?? newestScheduleForCompound(schedules, compound.id);
    const nextRoute = prefillSchedule?.administrationRoute ?? compound.administrationRoutes[0] ?? 'topical';
    const nextPreset = presetForSchedule(prefillSchedule);
    setRoute(nextRoute);
    setAmount(prefillSchedule && prefillSchedule.amount > 0 ? String(prefillSchedule.amount) : defaultAmount());
    setUnit(prefillSchedule?.unit ?? defaultUnit(nextRoute, compound));
    setTimePreset(nextPreset);
    setCustomTime(prefillSchedule?.timeOfDay ?? timeForPreset(nextPreset, '08:00'));
    setInjectionSite(prefillSchedule?.injectionSite ?? '');
    setRemindersEnabled(Boolean(isPro && prefillSchedule?.remindersEnabled));
    setSafetyConfirmed(false);
    setSaveState('idle');
  }, [compound, existingSchedule, isPro, schedules, visible]);

  useEffect(() => () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
  }, []);

  function selectRoute(nextRoute: AdministrationRoute | string) {
    setRoute(nextRoute);
    if (!existingSchedule || existingSchedule.amount <= 0) {
      setAmount(defaultAmount());
      setUnit(defaultUnit(nextRoute, compound));
    }
  }

  function setAmountFromInput(value: string) {
    setAmount(sanitizeDecimalInput(value));
  }

  const timeOfDay = timeForPreset(timePreset, customTime.trim());
  const amountNumber = Number(amount);
  const canSave = Boolean(compound && isReady && amountNumber > 0 && route && isValidTime(timeOfDay) && safetyConfirmed && saveState === 'idle');
  const isInjection = route === 'injection';
  const isEditing = Boolean(existingSchedule);

  async function toggleReminder() {
    if (!isPro) {
      setRemindersEnabled(false);
      await showPaywallWithAlert(showPaywall);
      return;
    }

    setRemindersEnabled((value) => !value);
  }

  async function saveStackSetup() {
    if (!compound || !canSave) return;
    setSaveState('saving');

    const schedule = {
      active: true,
      administrationRoute: route,
      amount: amountNumber,
      compoundId: compound.id,
      frequency: 'daily' as const,
      injectionSite: isInjection ? injectionSite.trim() || undefined : undefined,
      remindersEnabled: isPro && remindersEnabled,
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

    hapticLight();
    setSaveState('saved');

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = setTimeout(() => {
      onClose();
      onSaved?.();
    }, SUCCESS_DELAY_MS);
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.scrim}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <SafeAreaView edges={['bottom']} style={[styles.sheet, layout.isTablet && styles.sheetTablet]}>
            <View style={styles.handle} />
            <ScrollView
              contentContainerStyle={styles.sheetScroll}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.kicker}>{isEditing ? 'EDIT TRACKER' : 'ADD TRACKER'}</Text>
                <Text style={styles.title}>{compound?.name ?? 'Tracker'}</Text>
              </View>
              <Pressable accessibilityLabel="Close tracker setup" accessibilityRole="button" hitSlop={12} onPress={onClose} style={styles.closeButton}>
                <Ionicons color={colors.textMuted} name="close" size={20} />
              </Pressable>
            </View>

            <Text style={styles.label}>Amount from your own record</Text>
            <View style={styles.amountRow}>
              <TextInput
                accessibilityLabel="Amount from your own record"
                inputMode="decimal"
                keyboardType="decimal-pad"
                onChangeText={setAmountFromInput}
                placeholder="Enter amount"
                placeholderTextColor={colors.textFaint}
                returnKeyType="done"
                selectTextOnFocus
                style={styles.amountInput}
                value={amount}
              />
              <View style={styles.unitWrap}>
                {UNIT_OPTIONS.map((item) => (
                  <Pressable
                    accessibilityLabel={`Use ${formatDoseUnit(item)} as unit`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: unit === item }}
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

            <Text style={styles.label}>Route from your own record</Text>
            <View style={styles.routeRow}>
              {routeOptions.map((item) => {
                const selected = route === item;
                return (
                  <Pressable
                    accessibilityLabel={`Use ${ROUTE_LABELS[item] ?? item} route`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
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
                <Text style={styles.label}>Site note</Text>
                <TextInput
                  accessibilityLabel="Injection site note"
                  onChangeText={setInjectionSite}
                  placeholder="Optional private note"
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
                    accessibilityLabel={`Set time to ${label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
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
                accessibilityLabel="Custom time"
                onChangeText={setCustomTime}
                placeholder="08:00"
                placeholderTextColor={colors.textFaint}
                returnKeyType="done"
                style={[styles.textInput, styles.customTimeInput]}
                value={customTime}
              />
            ) : null}

            <Pressable
              accessibilityLabel={isPro ? 'Toggle private reminders' : 'Private reminders require Pro'}
              accessibilityRole="switch"
              accessibilityState={{ checked: remindersEnabled, disabled: !isPro }}
              onPress={toggleReminder}
              style={[styles.reminderBox, remindersEnabled && styles.reminderBoxOn, !isPro && styles.reminderBoxLocked]}>
              <View style={styles.reminderCopyWrap}>
                <Text style={[styles.reminderTitle, remindersEnabled && styles.reminderTitleOn]}>
                  {isPro ? reminderAccess.title : 'Pro private reminder'}
                </Text>
                <Text style={[styles.reminderCopy, remindersEnabled && styles.reminderCopyOn]}>
                  {isPro
                    ? 'Discreet lock-screen prompt. No compound name or amount shown.'
                    : 'Free trackers stay local. Pro adds quiet lock-screen accountability.'}
                </Text>
              </View>
              <Text style={[styles.reminderState, remindersEnabled && styles.reminderStateOn]}>
                {isPro ? (remindersEnabled ? 'ON' : 'OFF') : 'PRO'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Confirm safety understanding"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: safetyConfirmed }}
              onPress={() => setSafetyConfirmed((s) => !s)}
              style={styles.safetyRow}>
              <View style={[styles.checkbox, safetyConfirmed && styles.checkboxOn]}>
                {safetyConfirmed && <Ionicons name="checkmark" size={14} color={colors.background} />}
              </View>
              <Text style={styles.safetyText}>I understand this is a private tracking note only. GlowPep does not diagnose, treat, prescribe, recommend products, or choose amounts.</Text>
            </Pressable>

            <Pressable
              accessibilityLabel={isEditing ? 'Update tracker' : 'Add tracker'}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              onPress={saveStackSetup}
              style={({ pressed }) => [
                styles.saveButton,
                saveState === 'saved' && styles.saveButtonSaved,
                !canSave && saveState !== 'saved' && styles.saveButtonDisabled,
                pressed && canSave && styles.pressed,
              ]}>
              <Text style={[styles.saveText, saveState === 'saved' && styles.saveTextSaved]}>
                {saveState === 'saved' ? (isEditing ? 'Tracker updated' : 'Added to tracker') : isEditing ? 'Update tracker' : 'Add tracker'}
              </Text>
              <Ionicons
                color={saveState === 'saved' ? colors.accent : colors.accentInk}
                name={saveState === 'saved' ? 'checkmark-circle' : 'checkmark'}
                size={18}
              />
            </Pressable>
            </ScrollView>
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
    paddingVertical: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  amountRow: { flexDirection: 'row', gap: 12 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
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
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  routeChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  routeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  routeText: { ...t.label, color: colors.textMuted, fontSize: 12 },
  routeTextOn: { color: colors.accentInk },
  reminderBox: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 18,
    padding: 14,
  },
  reminderBoxLocked: {
    borderColor: `${colors.accent}33`,
  },
  reminderBoxOn: {
    borderColor: `${colors.accent}77`,
  },
  reminderCopyWrap: { flex: 1 },
  reminderTitle: { ...t.label, color: colors.text, fontSize: 13, marginBottom: 4 },
  reminderTitleOn: { color: colors.accent },
  reminderCopy: { ...t.bodySmall, color: colors.textDim, fontSize: 12, lineHeight: 17 },
  reminderCopyOn: { color: colors.textMuted },
  reminderState: { ...t.dataSmall, color: colors.textFaint },
  reminderStateOn: { color: colors.accent },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, minHeight: 44, paddingHorizontal: 4 },
  checkbox: { width: 26, height: 26, borderRadius: 7, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
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
  saveButtonSaved: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.accent,
    borderWidth: StyleSheet.hairlineWidth,
  },
  saveText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 14 },
  saveTextSaved: { color: colors.accent },
  scrim: { backgroundColor: 'rgba(0,0,0,0.62)', flex: 1 },
  sheet: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 14,
    width: '100%',
  },
  sheetTablet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxWidth: 620,
  },
  sheetScroll: { paddingBottom: 18 },
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
    minHeight: 44,
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
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  unitChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  unitText: { ...t.dataSmall, color: colors.textMuted },
  unitTextOn: { color: colors.accentInk },
  unitWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
});
