import { StyleSheet, View } from 'react-native';

import { colors } from '@/lib/constants/colors';

interface TickRowProps {
  activeIndex?: number;
  count?: number;
}

export function TickRow({ activeIndex, count = 11 }: TickRowProps) {
  const selected = activeIndex ?? Math.floor(count / 2);

  return (
    <View pointerEvents="none" style={styles.row}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.tick, index === selected && styles.tickOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  tick: {
    backgroundColor: colors.textFaint,
    height: 8,
    width: 1,
  },
  tickOn: {
    backgroundColor: colors.accent,
    height: 12,
  },
});
