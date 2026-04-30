import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import type { ResearchStatus } from '@/types/compound';

interface ResearchDotProps {
  status: ResearchStatus;
  compact?: boolean;
}

const labels: Record<ResearchStatus, string> = {
  'well-studied': 'STUDIED',
  promising: 'PROMISING',
  'early-research': 'EARLY',
};

const tones: Record<ResearchStatus, string> = {
  'well-studied': colors.accent,
  promising: colors.amber,
  'early-research': colors.rose,
};

export function ResearchDot({ status, compact = false }: ResearchDotProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: tones[status] }]} />
      {!compact ? <Text style={styles.label}>{labels[status]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  dot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  label: {
    ...t.eyebrow,
    color: colors.textDim,
    fontSize: 9,
  },
});
