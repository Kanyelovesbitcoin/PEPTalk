import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface EvidenceTileProps {
  label: string;
  value: number;
}

export function EvidenceTile({ label, value }: EvidenceTileProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const percent = Math.round(clamped * 100);
  const strong = clamped > 0.5;

  return (
    <View accessibilityLabel={`${label}: ${percent} percent`} accessible style={styles.tile}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, strong && styles.valueStrong]}>{percent}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, strong && styles.fillStrong, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.textFaint,
    borderRadius: 999,
    height: '100%',
    minWidth: 2,
  },
  fillStrong: {
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 0.9,
    minHeight: 20,
  },
  tile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 11,
    width: 112,
  },
  track: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 999,
    height: 4,
    marginTop: 9,
    overflow: 'hidden',
  },
  value: {
    color: colors.textMuted,
    fontFamily: fonts.serifLight,
    fontSize: 34,
    letterSpacing: -1,
    lineHeight: 37,
  },
  valueStrong: {
    color: colors.accent,
  },
});
