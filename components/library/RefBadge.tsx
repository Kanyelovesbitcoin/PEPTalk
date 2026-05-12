import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface RefBadgeProps {
  label?: string;
}

export function RefBadge({ label = 'Research reference' }: RefBadgeProps) {
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.label}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  label: {
    color: colors.accent,
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 1.4,
  },
});
