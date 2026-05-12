import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface PrimaryCTAProps {
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  loading?: boolean;
  onPress: () => void;
  onSecondaryPress?: () => void;
  secondaryLabel?: string;
}

export function PrimaryCTA({
  disabled = false,
  icon = 'arrow-forward',
  label,
  loading = false,
  onPress,
  onSecondaryPress,
  secondaryLabel,
}: PrimaryCTAProps) {
  const isDisabled = disabled || loading;

  return (
    <View style={styles.wrap}>
      {secondaryLabel && onSecondaryPress ? (
        <Pressable
          accessibilityLabel={secondaryLabel}
          accessibilityRole="button"
          onPress={onSecondaryPress}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.primary,
          isDisabled && styles.disabled,
          pressed && !isDisabled && styles.pressed,
        ]}>
        {loading ? <ActivityIndicator color={colors.accentInk} size="small" /> : null}
        <Text style={styles.primaryText}>{label}</Text>
        {!loading ? <Ionicons color={colors.accentInk} name={icon} size={18} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 18,
  },
  primaryText: {
    color: colors.accentInk,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  secondary: {
    alignItems: 'center',
    minHeight: 42,
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.textMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  wrap: {
    gap: 8,
    paddingTop: 10,
  },
});
