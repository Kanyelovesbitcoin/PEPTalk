import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  backDisabled?: boolean;
}

export function ProgressHeader({
  currentStep,
  totalSteps,
  onBack,
  backDisabled = false,
}: Readonly<ProgressHeaderProps>) {
  const progressWidth = `${Math.max(0, Math.min(1, currentStep / totalSteps)) * 100}%` as `${number}%`;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        accessibilityState={{ disabled: backDisabled }}
        disabled={backDisabled}
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed, backDisabled && styles.disabled]}>
        <Ionicons color={colors.text} name="arrow-back" size={18} />
      </Pressable>

      <View style={styles.progressBlock}>
        <Text accessibilityLiveRegion="polite" style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.track}>
          <View style={[styles.fill, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    minHeight: 48,
  },
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  progressBlock: {
    flex: 1,
    gap: 8,
  },
  stepText: {
    ...t.dataSmall,
    color: colors.textMuted,
    fontFamily: fonts.monoMedium,
  },
  track: {
    backgroundColor: colors.textFaint,
    borderRadius: 999,
    height: 5,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 5,
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
