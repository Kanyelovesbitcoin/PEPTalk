import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

export type TimeRange = '7d' | '30d' | '90d' | '1y';

interface TimeRangePillsProps {
  value: TimeRange;
  onChange: (next: TimeRange) => void;
}

const RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
];

export function TimeRangePills({ value, onChange }: Readonly<TimeRangePillsProps>) {
  return (
    <View style={styles.row}>
      {RANGES.map((range) => {
        const active = range.value === value;
        return (
          <Pressable
            accessibilityLabel={`${range.label} range`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={range.value}
            onPress={() => onChange(range.value)}
            style={({ pressed }) => [
              styles.pill,
              active && styles.pillOn,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, active && styles.labelOn]}>{range.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  pillOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...t.dataSmall,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  labelOn: {
    color: colors.accentInk,
  },
});
