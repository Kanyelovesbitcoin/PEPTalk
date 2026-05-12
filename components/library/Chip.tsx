import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface ChipProps {
  accessibilityLabel?: string;
  children?: ReactNode;
  label: string;
  on?: boolean;
  onPress?: () => void;
}

export function Chip({ accessibilityLabel, children, label, on = false, onPress }: ChipProps) {
  const content = (
    <>
      <Text style={[styles.label, on && styles.labelOn]}>{label.toUpperCase()}</Text>
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        onPress={onPress}
        style={({ pressed }) => [styles.base, on && styles.on, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.base, on && styles.on]}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 13,
  },
  label: {
    color: colors.textDim,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  labelOn: {
    color: colors.accent,
  },
  on: {
    backgroundColor: 'rgba(212, 168, 75, 0.09)',
    borderColor: 'rgba(212, 168, 75, 0.34)',
  },
  pressed: {
    opacity: 0.82,
  },
});
