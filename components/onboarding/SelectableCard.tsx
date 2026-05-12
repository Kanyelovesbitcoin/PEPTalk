import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

interface SelectableCardProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function SelectableCard({
  title,
  description,
  icon,
  selected,
  onPress,
  accessibilityLabel,
}: Readonly<SelectableCardProps>) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  function animateTo(value: number) {
    Animated.spring(scale, {
      damping: 16,
      mass: 0.8,
      stiffness: 260,
      toValue: value,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      onPressIn={() => animateTo(0.98)}
      onPressOut={() => animateTo(1)}
      style={styles.pressable}>
      <Animated.View
        style={[
          styles.card,
          selected && styles.cardSelected,
          focused && styles.cardFocused,
          { transform: [{ scale }] },
        ]}>
        {icon ? (
          <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
            <Ionicons color={selected ? colors.accentInk : colors.accent} name={icon} size={20} />
          </View>
        ) : null}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {selected ? (
          <View style={styles.check}>
            <Ionicons color={colors.accentInk} name="checkmark" size={16} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 18,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 72,
    padding: 16,
  },
  cardSelected: {
    backgroundColor: `${colors.accent}18`,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
  },
  cardFocused: {
    borderColor: colors.accentSoft,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconWrapSelected: {
    backgroundColor: colors.accent,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  description: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
  check: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});
