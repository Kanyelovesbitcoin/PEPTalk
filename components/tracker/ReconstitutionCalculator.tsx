import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CornerBrackets } from '@/components/ui/CornerBrackets';
import { TickRow } from '@/components/ui/TickRow';
import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import { compounds } from '@/lib/data/compounds';
import { useTracker } from '@/lib/hooks/useTracker';
import { calculateReconstitution, formatDoseUnit } from '@/lib/utils/reconstitution';
import type { MeasuredDoseUnit } from '@/types/tracker';

const units: MeasuredDoseUnit[] = ['mg', 'mcg', 'iu'];

function num(value: string) {
  return Number(value.replace(',', '.'));
}

function fixed(value: number, digits = 3) {
  return Number.isFinite(value) ? value.toFixed(digits).replace(/\.0+$/, '') : '0';
}

export function ReconstitutionCalculator() {
  const { addVialRecipe, vialRecipes } = useTracker();
  const [compoundId, setCompoundId] = useState(compounds[0]?.id ?? '');
  const [vialAmount, setVialAmount] = useState('5');
  const [vialUnit, setVialUnit] = useState<MeasuredDoseUnit>('mg');
  const [bacWaterMl, setBacWaterMl] = useState('2');
  const [targetDose, setTargetDose] = useState('');
  const [targetDoseUnit, setTargetDoseUnit] = useState<MeasuredDoseUnit>('mcg');
  const [notes, setNotes] = useState('');

  const result = useMemo(
    () =>
      calculateReconstitution({
        bacWaterMl: num(bacWaterMl),
        targetDose: num(targetDose),
        targetDoseUnit,
        vialAmount: num(vialAmount),
        vialUnit,
      }),
    [bacWaterMl, targetDose, targetDoseUnit, vialAmount, vialUnit],
  );

  function saveRecipe() {
    if (!result || !compoundId) {
      return;
    }

    addVialRecipe({
      bacWaterMl: num(bacWaterMl),
      compoundId,
      concentrationPerMl: result.concentrationPerMl,
      notes: notes.trim() || undefined,
      outputMl: result.outputMl,
      outputUnits: result.outputUnits,
      syringeType: 'u100',
      targetDose: num(targetDose),
      targetDoseUnit,
      vialAmount: num(vialAmount),
      vialUnit,
    });
    setNotes('');
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>REFERENCE CALCULATOR</Text>
      <Text style={styles.title}>User-entered math reference.</Text>
      <Text style={styles.copy}>Educational arithmetic utility only. Use values from your own records or clinician; GlowPep does not choose products, routes, or amounts.</Text>

      <View style={styles.stepRow}>
        {['REFERENCE', 'INPUTS', 'OUTPUT'].map((label, index) => (
          <View key={label} style={[styles.stepPill, index === 0 && styles.stepPillDone, index === 1 && styles.stepPillActive]}>
            <Text style={[styles.stepText, (index === 0 || index === 1) && styles.stepTextOn]}>{label}</Text>
          </View>
        ))}
      </View>

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
          <Text style={styles.label}>Vial amount</Text>
          <TextInput keyboardType="decimal-pad" onChangeText={setVialAmount} style={styles.input} value={vialAmount} />
        </View>
        <View style={styles.flexField}>
          <Text style={styles.label}>Unit</Text>
          <UnitSelector selected={vialUnit} setSelected={setVialUnit} />
        </View>
      </View>

      <Text style={styles.label}>BAC water (mL)</Text>
      <TextInput keyboardType="decimal-pad" onChangeText={setBacWaterMl} style={styles.input} value={bacWaterMl} />

      <View style={styles.row}>
        <View style={styles.flexField}>
          <Text style={styles.label}>Amount from your own record</Text>
          <TextInput keyboardType="decimal-pad" onChangeText={setTargetDose} style={styles.input} value={targetDose} />
        </View>
        <View style={styles.flexField}>
          <Text style={styles.label}>Unit</Text>
          <UnitSelector selected={targetDoseUnit} setSelected={setTargetDoseUnit} />
        </View>
      </View>

      <View style={styles.resultBox}>
        <CornerBrackets armLength={14} opacity={0.55} />
        {result ? (
          <>
            <Text style={styles.resultKicker}>REFERENCE OUTPUT</Text>
            <Text style={styles.resultMain}>{fixed(result.outputUnits, 1)} units</Text>
            <View style={styles.resultTicks}>
              <TickRow />
            </View>
            <Text style={styles.resultSub}>{fixed(result.outputMl, 3)} mL · {fixed(result.concentrationPerMl, 1)} {formatDoseUnit(targetDoseUnit)}/mL equivalent</Text>
          </>
        ) : (
          <Text style={styles.errorText}>Enter matching units. IU must be calculated against IU.</Text>
        )}
      </View>

      <Text style={styles.label}>Recipe notes</Text>
      <TextInput onChangeText={setNotes} placeholder="Label, storage, reminder..." placeholderTextColor={colors.textFaint} style={styles.input} value={notes} />

      <Pressable disabled={!result} onPress={saveRecipe} style={({ pressed }) => [styles.button, !result && styles.buttonDisabled, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Save vial recipe</Text>
      </Pressable>
      <Text style={styles.disclaimer}>Calculation only. Not dosing, administration, product, or medical guidance. Verify independently with a licensed professional.</Text>

      {vialRecipes.length > 0 ? (
        <View style={styles.savedWrap}>
          <Text style={styles.savedTitle}>Saved recipes</Text>
          {vialRecipes.slice(0, 3).map((recipe) => {
            const compound = compounds.find((item) => item.id === recipe.compoundId);
            return (
              <View key={recipe.id} style={styles.savedRow}>
                <Text style={styles.savedName}>{compound?.name ?? 'Compound'}</Text>
                <Text style={styles.savedMeta}>{recipe.vialAmount}{formatDoseUnit(recipe.vialUnit)} + {recipe.bacWaterMl}mL → {fixed(recipe.outputUnits, 1)}u</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function UnitSelector({ selected, setSelected }: { selected: MeasuredDoseUnit; setSelected: (unit: MeasuredDoseUnit) => void }) {
  return (
    <View style={styles.segmentRow}>
      {units.map((unit) => (
        <Pressable key={unit} onPress={() => setSelected(unit)} style={[styles.segment, selected === unit && styles.segmentOn]}>
          <Text style={[styles.segmentText, selected === unit && styles.segmentTextOn]}>{formatDoseUnit(unit)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16, padding: 18 },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 8 },
  title: { ...t.displaySmall, color: colors.text, fontSize: 23, lineHeight: 27, marginBottom: 6 },
  copy: { ...t.bodySmall, color: colors.textMuted, marginBottom: 12 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stepPill: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepPillActive: { borderColor: colors.accent },
  stepPillDone: { backgroundColor: `${colors.accent}1A`, borderColor: `${colors.accent}55` },
  stepText: { ...t.dataSmall, color: colors.textDim, fontSize: 8, textAlign: 'center' },
  stepTextOn: { color: colors.accent },
  label: { ...t.eyebrow, color: colors.textDim, marginBottom: 8, marginTop: 10 },
  chipScroller: { marginBottom: 4 },
  chip: { backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, marginRight: 8, paddingHorizontal: 13, paddingVertical: 9 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...t.label, color: colors.textMuted, fontSize: 12 },
  chipTextOn: { color: colors.accentInk },
  row: { flexDirection: 'row', gap: 12 },
  flexField: { flex: 1 },
  input: { ...t.bodySmall, backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, color: colors.text, paddingHorizontal: 13, paddingVertical: 12 },
  segmentRow: { flexDirection: 'row', gap: 6 },
  segment: { alignItems: 'center', backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, flex: 1, paddingVertical: 12 },
  segmentOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmentText: { ...t.label, color: colors.textMuted, fontSize: 10, textTransform: 'uppercase' },
  segmentTextOn: { color: colors.accentInk },
  resultBox: { backgroundColor: colors.surface, borderColor: `${colors.accent}55`, borderRadius: 24, borderWidth: 1, marginTop: 16, overflow: 'hidden', padding: 18, position: 'relative' },
  resultKicker: { ...t.eyebrow, color: colors.accent, marginBottom: 6 },
  resultMain: { ...t.displayLg, color: colors.accent },
  resultTicks: { marginBottom: 8, marginTop: 4 },
  resultSub: { ...t.bodySmall, color: colors.textMuted, marginTop: 4 },
  errorText: { ...t.bodySmall, color: colors.warning },
  button: { backgroundColor: colors.accent, borderRadius: 13, marginTop: 16, paddingVertical: 14 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { ...t.label, color: colors.accentInk, textAlign: 'center' },
  disclaimer: { ...t.dataSmall, color: colors.textDim, lineHeight: 16, marginTop: 10, textAlign: 'center' },
  savedWrap: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 18, paddingTop: 14 },
  savedTitle: { ...t.eyebrow, color: colors.textDim, marginBottom: 10 },
  savedRow: { backgroundColor: colors.backgroundAlt, borderColor: colors.border, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 11 },
  savedName: { ...t.label, color: colors.text, flex: 1, fontSize: 12 },
  savedMeta: { ...t.dataSmall, color: colors.textMuted, flex: 1.2, textAlign: 'right' },
  pressed: { opacity: 0.82 },
});
