import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

export function SkinMetricRow({ description, label, value }: { description: string; label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <View style={styles.labelCopy}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Text style={styles.value}>{safeValue} / 100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${safeValue}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, marginBottom: 16 },
  labelRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  labelCopy: { flex: 1 },
  label: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 13 },
  description: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 11, lineHeight: 16, marginTop: 2 },
  value: { color: colors.accentSoft, fontFamily: fonts.monoMedium, fontSize: 12 },
  track: { backgroundColor: colors.backgroundAlt, borderRadius: 999, height: 5, overflow: 'hidden' },
  fill: { backgroundColor: colors.accentSoft, borderRadius: 999, height: 5 },
});
