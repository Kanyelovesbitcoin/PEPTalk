import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';

interface OnboardingFooterProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function OnboardingFooter({ label, onPress, disabled = false, loading = false }: Readonly<OnboardingFooterProps>) {
  const isDisabled = disabled || loading;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.primaryButton,
          isDisabled && styles.primaryButtonDisabled,
          pressed && !isDisabled && styles.pressed,
        ]}>
        {loading ? <ActivityIndicator color={colors.accentInk} size="small" /> : null}
        <Text style={styles.primaryButtonText}>{label}</Text>
        {!loading ? <Ionicons color={colors.accentInk} name="arrow-forward" size={18} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.accentInk,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.82,
  },
});
