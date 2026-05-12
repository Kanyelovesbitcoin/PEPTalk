import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface SelectableChipProps {
  title: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function SelectableChip({ title, selected, onPress, accessibilityLabel }: Readonly<SelectableChipProps>) {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        focused && styles.chipFocused,
        pressed && styles.chipPressed,
      ]}>
      <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
      {selected ? <Ionicons color={colors.accentInk} name="checkmark" size={15} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipFocused: {
    borderColor: colors.accentSoft,
  },
  chipPressed: {
    opacity: 0.82,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  titleSelected: {
    color: colors.accentInk,
  },
});
