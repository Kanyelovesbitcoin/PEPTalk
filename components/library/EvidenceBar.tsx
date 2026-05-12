import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface EvidenceBarProps {
  label: string;
  value: number;
}

export function EvidenceBar({ label, value }: EvidenceBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const percent = Math.round(clamped * 100);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <Text style={styles.value}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]}>
          <View style={styles.fillGlow} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: '100%',
    minWidth: 2,
    overflow: 'hidden',
  },
  fillGlow: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 18,
  },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  label: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  track: {
    backgroundColor: colors.textFaint,
    borderRadius: 999,
    height: 5,
    overflow: 'hidden',
  },
  value: {
    color: colors.accent,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  wrap: {
    width: '100%',
  },
});
