import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import type { CompoundType } from '@/types/compound';

interface BadgeProps {
  type: CompoundType;
}

export function Badge({ type }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{type.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    ...t.eyebrow,
    color: colors.textDim,
    fontSize: 9,
  },
});
