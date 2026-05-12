import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

interface SummaryRow {
  label: string;
  value: string;
}

interface PlanSummaryCardProps {
  rows: SummaryRow[];
}

export function PlanSummaryCard({ rows }: Readonly<PlanSummaryCardProps>) {
  return (
    <View style={styles.card}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: `${colors.accent}55`,
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  row: {
    gap: 5,
  },
  label: {
    ...t.dataSmall,
    color: colors.accentSoft,
    fontFamily: fonts.monoMedium,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
});
