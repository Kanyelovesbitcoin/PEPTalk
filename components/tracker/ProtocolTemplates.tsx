import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { goalById } from '@/lib/constants/goals';
import { type as t } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';
import { protocolTemplates } from '@/lib/data/protocolTemplates';
import { useTracker } from '@/lib/hooks/useTracker';
import { formatDoseUnit } from '@/lib/utils/reconstitution';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function ProtocolTemplates() {
  const { addSchedule } = useTracker();

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>TEMPLATES</Text>
      <Text style={styles.title}>Start from a safe scaffold.</Text>
      <Text style={styles.copy}>Templates create editable tracking schedules with placeholder amounts. They are not dosing advice.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {protocolTemplates.map((template) => {
          const goal = goalById[template.goal];
          const compound = compoundById[template.compoundId];
          return (
            <Pressable
              key={template.id}
              onPress={() =>
                addSchedule({
                  active: true,
                  amount: template.starterAmount,
                  compoundId: template.compoundId,
                  customDays: template.customDays,
                  frequency: template.frequency,
                  injectionSite: template.site,
                  remindersEnabled: false,
                  startDate: todayKey(),
                  timeOfDay: template.timeOfDay,
                  unit: template.unit,
                })
              }
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <Text style={styles.goal}>{goal.shortTitle.toUpperCase()}</Text>
              <Text style={styles.cardTitle}>{template.title}</Text>
              <Text style={styles.meta}>{compound?.name ?? 'Compound'} · {template.starterAmount}{formatDoseUnit(template.unit)} placeholder · {template.timeOfDay}</Text>
              <Text style={styles.note}>{template.note}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16, padding: 18 },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 8 },
  title: { ...t.displaySmall, color: colors.text, fontSize: 23, lineHeight: 27, marginBottom: 6 },
  copy: { ...t.bodySmall, color: colors.textMuted, marginBottom: 14 },
  card: { backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, marginRight: 10, padding: 15, width: 238 },
  goal: { ...t.eyebrow, color: colors.accent, marginBottom: 10 },
  cardTitle: { ...t.label, color: colors.text, fontSize: 15, lineHeight: 19, marginBottom: 8 },
  meta: { ...t.dataSmall, color: colors.textMuted, lineHeight: 16 },
  note: { ...t.bodySmall, color: colors.textFaint, fontSize: 12, marginTop: 10 },
  pressed: { opacity: 0.82 },
});
