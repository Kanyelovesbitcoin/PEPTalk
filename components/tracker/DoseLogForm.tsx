import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';
import { compoundById, compounds } from '@/lib/data/compounds';
import { useTracker } from '@/lib/hooks/useTracker';
import { formatDoseUnit } from '@/lib/utils/reconstitution';
import type { DoseLog, DoseStatus, DoseUnit } from '@/types/tracker';

const units: DoseUnit[] = ['mcg', 'mg'];

const routeOptions = [
  { label: 'Syringe', sub: 'Subcutaneous', value: 'syringe-subcutaneous' },
  { label: 'Syringe', sub: 'Intramuscular', value: 'syringe-intramuscular' },
  { label: 'Nasal Spray', sub: 'Intranasal', value: 'nasal-spray' },
  { label: 'Oral', sub: 'Capsule / Liquid', value: 'oral' },
  { label: 'Topical', sub: 'Cream / Gel', value: 'topical' },
  { label: 'IV Drip', sub: 'Intravenous', value: 'iv-drip' },
];

const sideEffectOptions = [
  'Site redness',
  'Site swelling',
  'Site pain',
  'Site itching',
  'Fatigue',
  'Headache',
  'Nausea',
  'Dizziness',
  'Flushing/warmth',
  'Water retention',
  'Libido change',
  'Mood change',
  'Acne',
  'Bloating',
  'Appetite change',
];

const feedbackOptions: { label: string; value: NonNullable<DoseLog['feedback']>; hint: string }[] = [
  { label: 'Nothing noticeable', value: 'nothing', hint: 'This is common early on. Baseline data is still useful.' },
  { label: 'Felt better', value: 'better', hint: 'Great signal. Consider logging what improved so you can compare later.' },
  { label: 'Too strong', value: 'too-strong', hint: 'A clear sign to reduce or space out your next dose.' },
  { label: 'Side effects', value: 'side-effects', hint: 'Note which ones above. If they persist, pause and consult your clinician.' },
  { label: 'Unsure', value: 'unsure', hint: 'That is okay. Keep the same protocol for now and reassess tomorrow.' },
];

function nowParts() {
  const now = new Date();
  const hour = now.getHours();
  const hour12 = hour % 12 || 12;
  return {
    hour: String(hour12),
    minute: String(now.getMinutes()).padStart(2, '0'),
    period: hour >= 12 ? 'PM' : 'AM',
  };
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildScheduledAt(day: 'today' | 'yesterday' | 'custom', customDate: Date, hour: string, minute: string, period: string) {
  const date = new Date(day === 'custom' ? customDate : new Date());
  if (day === 'yesterday') date.setDate(date.getDate() - 1);

  let hourNumber = Number(hour);
  if (period === 'PM' && hourNumber !== 12) hourNumber += 12;
  if (period === 'AM' && hourNumber === 12) hourNumber = 0;

  date.setHours(hourNumber, Number(minute), 0, 0);
  return date.toISOString();
}

export function DoseLogForm({ onSaved }: { onSaved?: () => void }) {
  const { addDoseLog, doseLogs } = useTracker();
  const initialTime = useMemo(() => nowParts(), []);
  const [compoundId, setCompoundId] = useState('');
  const [compoundModalOpen, setCompoundModalOpen] = useState(false);
  const [compoundQuery, setCompoundQuery] = useState('');
  const [amount, setAmount] = useState('250');
  const [unit, setUnit] = useState<DoseUnit>('mcg');
  const [route, setRoute] = useState(routeOptions[0].value);
  const [dateSegment, setDateSegment] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate] = useState(new Date());
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [period, setPeriod] = useState(initialTime.period);
  const [notes, setNotes] = useState('');
  const [sideEffects, setSideEffects] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<DoseLog['feedback']>(undefined);
  const [sideEffectQuery, setSideEffectQuery] = useState('');
  const [showRouteControls, setShowRouteControls] = useState(false);
  const [showTimeControls, setShowTimeControls] = useState(false);

  const selectedCompound = compoundById[compoundId];
  const filteredCompounds = useMemo(() => {
    const query = compoundQuery.trim().toLowerCase();
    return [...compounds]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((compound) => {
        if (!query) return true;
        const nickname = compound.nickname?.toLowerCase() ?? '';
        return compound.name.toLowerCase().includes(query) || nickname.includes(query);
      });
  }, [compoundQuery]);

  const recentSideEffects = useMemo(() => {
    const counts = new Map<string, number>();
    doseLogs.forEach((log) => {
      log.sideEffects?.forEach((effect) => counts.set(effect, (counts.get(effect) ?? 0) + 1));
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([effect]) => effect);
  }, [doseLogs]);

  const sideEffectResults = useMemo(() => {
    const query = sideEffectQuery.trim().toLowerCase();
    if (!query) return recentSideEffects;
    return sideEffectOptions.filter((effect) => effect.toLowerCase().includes(query)).slice(0, 6);
  }, [recentSideEffects, sideEffectQuery]);

  const selectedRoute = routeOptions.find((item) => item.value === route) ?? routeOptions[0];

  useEffect(() => {
    if (!compoundId) return;
    const lastLog = doseLogs.find((log) => log.compoundId === compoundId);
    if (lastLog) {
      setAmount(String(lastLog.amount));
      setUnit(lastLog.unit);
      if (lastLog.administrationRoute) setRoute(lastLog.administrationRoute);
    }
  }, [compoundId, doseLogs]);

  const canSave = Boolean(compoundId && Number(amount) > 0);

  function selectCompound(id: string) {
    const compound = compoundById[id];
    setCompoundId(id);
    setCompoundQuery(compound?.name ?? '');
    setCompoundModalOpen(false);
  }

  function toggleSideEffect(effect: string) {
    setSideEffects((current) =>
      current.includes(effect) ? current.filter((item) => item !== effect) : [...current, effect],
    );
  }

  function adjustHour(delta: number) {
    let h = Number(hour) + delta;
    if (h > 12) h = 1;
    if (h < 1) h = 12;
    setHour(String(h));
  }

  function adjustMinute(delta: number) {
    let m = Number(minute) + delta;
    if (m > 59) m = 0;
    if (m < 0) m = 59;
    setMinute(String(m).padStart(2, '0'));
  }

  function saveDose() {
    if (!canSave) return;

    const scheduledAt = buildScheduledAt(dateSegment, customDate, hour, minute, period);
    const status: DoseStatus = 'taken';
    addDoseLog({
      administrationRoute: route,
      amount: Number(amount),
      compoundId,
      feedback,
      notes: notes.trim() || undefined,
      scheduledAt,
      sideEffects,
      status,
      takenAt: scheduledAt,
      unit,
    });
    setNotes('');
    setSideEffects([]);
    setFeedback(undefined);
    setSideEffectQuery('');
    Vibration.vibrate(10);
    onSaved?.();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
      <View style={styles.panel}>
        <View style={styles.formTopBar}>
          <Text style={styles.backGlyph}>‹</Text>
          <Text style={styles.formTitle}>LOG PROTOCOL</Text>
          <Ionicons color={colors.textDim} name="time-outline" size={22} />
        </View>

        <Pressable
          accessibilityLabel="Choose compound"
          accessibilityRole="button"
          onPress={() => setCompoundModalOpen(true)}
          style={({ pressed }) => [styles.compoundCard, pressed && styles.pressed]}>
          <View>
            <Text style={styles.compoundName}>{selectedCompound?.name ?? 'Select compound'}</Text>
            <Text style={styles.compoundMeta}>{selectedCompound?.nickname ?? 'Search legal peptides'}</Text>
          </View>
          <View style={styles.compoundActions}>
            <Ionicons color={colors.textDim} name="chevron-forward" size={18} />
            <Ionicons color={colors.textDim} name="create-outline" size={18} />
          </View>
        </Pressable>

        <Text style={styles.label}>Dose</Text>
        <View style={styles.doseBox}>
          <TextInput keyboardType="decimal-pad" onChangeText={setAmount} style={styles.amountInput} value={amount} />
          <View style={styles.unitRow}>
            {units.map((item) => (
              <Pressable key={item} onPress={() => setUnit(item)} style={[styles.unitButton, unit === item && styles.unitButtonOn]}>
                <Text style={[styles.unitText, unit === item && styles.unitTextOn]}>{formatDoseUnit(item)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.label}>Administration Route</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowRouteControls((value) => !value)}
          style={({ pressed }) => [styles.compactRow, pressed && styles.pressed]}>
          <View>
            <Text style={styles.compactTitle}>{selectedRoute.label}</Text>
            <Text style={styles.compactMeta}>{selectedRoute.sub}</Text>
          </View>
          <Text style={styles.textAction}>{showRouteControls ? 'Done' : 'Change'}</Text>
        </Pressable>
        {showRouteControls ? (
          <View style={styles.routeGrid}>
            {[0, 2, 4].map((start) => (
              <View key={start} style={styles.routeRow}>
                {routeOptions.slice(start, start + 2).map((item) => {
                  const selected = route === item.value;
                  return (
                    <Pressable key={item.value} onPress={() => setRoute(item.value)} style={[styles.routeCard, selected && styles.routeCardOn]}>
                      <Text style={[styles.routeTitle, selected && styles.routeTitleOn]}>{item.label}</Text>
                      <Text style={[styles.routeSub, selected && styles.routeSubOn]}>{item.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowTimeControls((value) => !value)}
          style={({ pressed }) => [styles.timeSummary, pressed && styles.pressed]}>
          <View>
            <Text style={styles.labelInline}>Timestamp</Text>
            <Text style={styles.compactMeta}>
              {dateSegment === 'today' ? 'Now' : dateSegment === 'yesterday' ? 'Yesterday' : formatDateLabel(customDate)} · {hour}:{minute} {period}
            </Text>
          </View>
          <Text style={styles.textAction}>{showTimeControls ? 'Done' : 'Edit time'}</Text>
        </Pressable>
        {showTimeControls ? (
          <>
            <ScrollView
              contentContainerStyle={styles.dateScroller}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <DateButton label="Today" active={dateSegment === 'today'} onPress={() => setDateSegment('today')} />
              <DateButton label="Yesterday" active={dateSegment === 'yesterday'} onPress={() => setDateSegment('yesterday')} />
              <DateButton label={formatDateLabel(customDate)} wide active={dateSegment === 'custom'} onPress={() => setDateSegment('custom')} />
            </ScrollView>

            <View style={styles.timePanel}>
              <View style={styles.timeBlock}>
                <Pressable onPress={() => adjustHour(-1)} style={styles.timeStepper}>
                  <Ionicons color={colors.textMuted} name="remove" size={18} />
                </Pressable>
                <Text style={styles.timeValue}>{hour}</Text>
                <Pressable onPress={() => adjustHour(1)} style={styles.timeStepper}>
                  <Ionicons color={colors.textMuted} name="add" size={18} />
                </Pressable>
              </View>
              <Text style={styles.timeColon}>:</Text>
              <View style={styles.timeBlock}>
                <Pressable onPress={() => adjustMinute(-1)} style={styles.timeStepper}>
                  <Ionicons color={colors.textMuted} name="remove" size={18} />
                </Pressable>
                <Text style={styles.timeValue}>{minute}</Text>
                <Pressable onPress={() => adjustMinute(1)} style={styles.timeStepper}>
                  <Ionicons color={colors.textMuted} name="add" size={18} />
                </Pressable>
              </View>
              <Pressable onPress={() => setPeriod((p) => (p === 'AM' ? 'PM' : 'AM'))} style={styles.periodToggle}>
                <Text style={styles.periodText}>{period}</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          multiline
          onChangeText={setNotes}
          placeholder="Observations, how you feel, any side effects..."
          placeholderTextColor={colors.textFaint}
          style={[styles.input, styles.notes]}
          textAlignVertical="top"
          value={notes}
        />

        <Text style={styles.label}>How did it feel?</Text>
        <View style={styles.feedbackWrap}>
          {feedbackOptions.map((item) => {
            const selected = feedback === item.value;
            return (
              <Pressable key={item.value} onPress={() => setFeedback(item.value)} style={[styles.feedbackChip, selected && styles.feedbackChipOn]}>
                <Text style={[styles.feedbackText, selected && styles.feedbackTextOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {feedback ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>{feedbackOptions.find((f) => f.value === feedback)?.hint}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Side Effects <Text style={styles.optional}>(Optional)</Text></Text>
        <TextInput
          autoCapitalize="sentences"
          onChangeText={setSideEffectQuery}
          placeholder="Search or add a symptom"
          placeholderTextColor={colors.textFaint}
          style={styles.tagInput}
          value={sideEffectQuery}
        />
        {sideEffects.length > 0 ? (
          <View style={styles.sideEffectWrap}>
            {sideEffects.map((effect) => (
              <Pressable key={effect} onPress={() => toggleSideEffect(effect)} style={[styles.sideEffectChip, styles.sideEffectChipOn]}>
                <Text style={[styles.sideEffectText, styles.sideEffectTextOn]}>{effect} ×</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.sideEffectWrap}>
          {sideEffectResults.map((effect) => {
            const selected = sideEffects.includes(effect);
            return (
              <Pressable key={effect} onPress={() => toggleSideEffect(effect)} style={[styles.sideEffectChip, selected && styles.sideEffectChipOn]}>
                <Text style={[styles.sideEffectText, selected && styles.sideEffectTextOn]}>{effect}</Text>
              </Pressable>
            );
          })}
          {sideEffectQuery.trim() && !sideEffectOptions.some((effect) => effect.toLowerCase() === sideEffectQuery.trim().toLowerCase()) ? (
            <Pressable onPress={() => toggleSideEffect(sideEffectQuery.trim())} style={styles.sideEffectChip}>
              <Text style={styles.sideEffectText}>Add "{sideEffectQuery.trim()}"</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable disabled={!canSave} onPress={saveDose} style={({ pressed }) => [styles.logButton, !canSave && styles.logButtonDisabled, pressed && styles.pressed]}>
          <Text style={styles.logButtonText}>Log Dose</Text>
        </Pressable>
        <Text style={styles.streakText}>♧ 1 day streak</Text>
      </View>

      <CompoundPickerModal
        query={compoundQuery}
        results={filteredCompounds}
        selectedId={compoundId}
        visible={compoundModalOpen}
        onChangeQuery={setCompoundQuery}
        onClose={() => setCompoundModalOpen(false)}
        onSelect={selectCompound}
      />
    </KeyboardAvoidingView>
  );
}

function DateButton({ label, active, wide, onPress }: { label: string; active: boolean; wide?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.dateButton, wide && styles.dateButtonWide, active && styles.dateButtonOn]}>
      <Text style={[styles.dateButtonText, active && styles.dateButtonTextOn]}>{label}</Text>
    </Pressable>
  );
}

function CompoundPickerModal({
  visible,
  query,
  results,
  selectedId,
  onChangeQuery,
  onClose,
  onSelect,
}: {
  visible: boolean;
  query: string;
  results: typeof compounds;
  selectedId: string;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Pressable accessibilityLabel="Close compound search" onPress={onClose} style={styles.modalIconButton}>
            <Ionicons color={colors.text} name="chevron-back" size={22} />
          </Pressable>
          <Text style={styles.modalTitle}>Choose Compound</Text>
          <View style={styles.modalIconButton} />
        </View>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          onChangeText={onChangeQuery}
          placeholder="Search peptides"
          placeholderTextColor={colors.textFaint}
          style={styles.modalSearch}
          value={query}
        />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {results.length > 0 ? results.map((item) => {
            const selected = item.id === selectedId;
            return (
              <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.modalRow, selected && styles.modalRowOn]}>
                <View style={styles.modalRowTextWrap}>
                  <Text style={[styles.modalRowTitle, selected && styles.modalRowTitleOn]}>{item.name}</Text>
                  <Text style={[styles.modalRowSub, selected && styles.modalRowSubOn]} numberOfLines={1}>{item.nickname ?? item.summary}</Text>
                </View>
                {selected ? <Ionicons color={colors.accentInk} name="checkmark" size={18} /> : null}
              </Pressable>
            );
          }) : (
            <View style={styles.modalEmpty}>
              <Text style={styles.modalEmptyText}>No compounds found.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: { flex: 1 },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  formTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backGlyph: { color: colors.textMuted, fontSize: 28, lineHeight: 28 },
  formTitle: { ...t.eyebrow, color: colors.textMuted, letterSpacing: 1.8 },
  compoundCard: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
    minHeight: 88,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  compoundName: { color: colors.text, fontFamily: fonts.serif, fontSize: 21, lineHeight: 25 },
  compoundMeta: { ...t.eyebrow, color: colors.textFaint, marginTop: 8 },
  compoundActions: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  label: { ...t.eyebrow, color: colors.textDim, marginBottom: 10, marginTop: 12 },
  doseBox: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    padding: 8,
  },
  amountInput: { color: colors.text, flex: 1, fontFamily: fonts.sans, fontSize: 20, paddingHorizontal: 12, paddingVertical: 12 },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 58,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  unitButtonOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  unitText: { ...t.label, color: colors.textDim, fontSize: 13, textTransform: 'lowercase' },
  unitTextOn: { color: colors.accentInk },
  compactRow: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  compactTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 15 },
  compactMeta: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 13, marginTop: 3 },
  textAction: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 13 },
  labelInline: { ...t.eyebrow, color: colors.textDim, marginBottom: 3 },
  timeSummary: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 8,
    minHeight: 58,
    paddingVertical: 8,
  },
  routeGrid: { gap: 10, marginBottom: 14 },
  routeRow: { flexDirection: 'row', gap: 10 },
  routeCard: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 62,
    paddingVertical: 12,
  },
  routeCardOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  routeTitle: { color: colors.textMuted, fontFamily: fonts.sansMedium, fontSize: 14 },
  routeTitleOn: { color: colors.accentInk },
  routeSub: { color: colors.textFaint, fontFamily: fonts.sans, fontSize: 12, marginTop: 4, textAlign: 'center' },
  routeSubOn: { color: colors.accentInk, opacity: 0.7 },
  dateScroller: { gap: 10, paddingBottom: 14, paddingRight: 4 },
  dateButton: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  dateButtonWide: { minWidth: 154 },
  dateButtonOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  dateButtonText: { color: colors.textMuted, fontFamily: fonts.sansMedium, fontSize: 15 },
  dateButtonTextOn: { color: colors.accentInk },
  timePanel: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 142,
    justifyContent: 'center',
    marginBottom: 14,
    paddingHorizontal: 18,
  },
  timeBlock: { alignItems: 'center', gap: 10 },
  timeStepper: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: 'center',
    width: 52,
  },
  timeValue: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 28,
    letterSpacing: -0.5,
    minWidth: 52,
    textAlign: 'center',
  },
  timeColon: { color: colors.textDim, fontFamily: fonts.sansMedium, fontSize: 24, marginHorizontal: 10 },
  periodToggle: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    height: 52,
    justifyContent: 'center',
    marginLeft: 18,
    width: 62,
  },
  periodText: { color: colors.textMuted, fontFamily: fonts.sansMedium, fontSize: 18 },
  input: {
    ...t.bodySmall,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  notes: { minHeight: 110, marginBottom: 14 },
  optional: { color: colors.textFaint, fontSize: 10 },
  feedbackWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  feedbackChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  feedbackChipOn: { backgroundColor: 'rgba(216,178,95,0.16)', borderColor: colors.accent },
  feedbackText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13 },
  feedbackTextOn: { color: colors.accent },
  hintBox: {
    backgroundColor: 'rgba(216,178,95,0.08)',
    borderColor: 'rgba(216,178,95,0.2)',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hintText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  tagInput: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 15,
    marginBottom: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  sideEffectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  sideEffectChip: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  sideEffectChipOn: { backgroundColor: 'rgba(216,178,95,0.16)', borderColor: colors.accent },
  sideEffectText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13 },
  sideEffectTextOn: { color: colors.accent },
  logButton: { backgroundColor: colors.accent, borderRadius: 13, paddingVertical: 18, shadowColor: colors.accent, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 18 },
  logButtonDisabled: { opacity: 0.45 },
  logButtonText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 16, textAlign: 'center' },
  streakText: { color: colors.accent, fontFamily: fonts.sansMedium, fontSize: 14, marginTop: 14, textAlign: 'center' },
  modalSafe: { backgroundColor: colors.background, flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  modalIconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  modalTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 18, letterSpacing: -0.2 },
  modalSearch: { backgroundColor: colors.backgroundAlt, borderColor: colors.border, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontFamily: fonts.sans, fontSize: 16, marginBottom: 14, paddingHorizontal: 16, paddingVertical: 15 },
  modalRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginBottom: 10, minHeight: 72, paddingHorizontal: 16, paddingVertical: 12 },
  modalRowOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  modalRowTextWrap: { flex: 1 },
  modalRowTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 16 },
  modalRowTitleOn: { color: colors.accentInk },
  modalRowSub: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 13, marginTop: 4 },
  modalRowSubOn: { color: colors.accentInk, opacity: 0.72 },
  modalEmpty: { alignItems: 'center', paddingVertical: 32 },
  modalEmptyText: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 14 },
  pressed: { opacity: 0.82 },
});
