import { StyleSheet, View } from 'react-native';

import { colors } from '@/lib/constants/colors';

interface BreadthDotsProps {
  value?: 1 | 2 | 3;
}

export function BreadthDots({ value = 1 }: BreadthDotsProps) {
  return (
    <View style={styles.row}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={[styles.dot, index < value && styles.dotOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.textFaint,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dotOn: {
    backgroundColor: colors.accent,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
});
