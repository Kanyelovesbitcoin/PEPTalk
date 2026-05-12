import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { AmbientGlow } from '@/components/ui/AmbientGlow';
import { CornerBrackets } from '@/components/ui/CornerBrackets';
import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import { usePro } from '@/lib/hooks/usePro';

interface LockedSectionProps {
  onPress: () => void;
  title?: string;
  copy?: string;
  variant?: 'full' | 'compact';
}

const FEATURES: Array<{ icon: keyof typeof Ionicons.glyphMap; text: string }> = [
  { icon: 'folder-open-outline', text: 'Your Record export' },
  { icon: 'notifications-outline', text: 'Private routine reminders' },
  { icon: 'repeat-outline', text: 'Multiple saved routines' },
  { icon: 'sparkles-outline', text: 'AI-assisted Glowmax organization' },
];

export function LockedSection({
  onPress,
  title = 'Start GlowPep Pro',
  copy = 'Trial adds the deep Glowmax guide, Your Record export, private reminders, saved items, and AI-assisted organization.',
  variant = 'full',
}: LockedSectionProps) {
  const { paywallStatus, restorePurchases } = usePro();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { duration: 3000, toValue: 1, useNativeDriver: true }),
        Animated.timing(shimmer, { duration: 3000, toValue: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [shimmer]);

  async function handleRestore() {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? 'Restored' : 'Nothing to restore',
      restored
        ? 'Your Pro access is active.'
        : 'No active GlowPep Pro purchase was found for this Apple account.',
    );
  }

  if (variant === 'compact') {
    return (
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.compact, pressed && styles.pressed]}>
        <View style={styles.compactInner}>
          <View style={styles.compactDot} />
          <Ionicons color={colors.accent} name="lock-closed" size={14} />
          <Text style={styles.compactText}>Unlock with GlowPep Pro - 7 days free</Text>
        </View>
        <Text style={styles.compactArrow}>-&gt;</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <AmbientGlow opacity={0.04} right={-90} size={260} top={-120} />
      <View style={styles.head}>
        <Text style={styles.kicker}>PEPTALK PRO</Text>
        <Text style={styles.trialBadge}>7-DAY TRIAL</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>
      {!paywallStatus.canPresent ? (
        <Text style={styles.unavailable}>
          Purchases are unavailable in this build. Free features remain available.
        </Text>
      ) : null}

      <View style={styles.grid}>
        <CornerBrackets armLength={14} opacity={0.5} />
        {FEATURES.map((feature) => (
          <View key={feature.text} style={styles.gridItem}>
            <View style={styles.gridIcon}>
              <Ionicons color={colors.accent} name={feature.icon} size={14} />
            </View>
            <Text style={styles.gridText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityLabel={paywallStatus.canPresent ? 'Start GlowPep Pro trial' : 'Purchases unavailable'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !paywallStatus.canPresent }}
        disabled={!paywallStatus.canPresent}
        onPress={onPress}
        style={({ pressed }) => [styles.button, !paywallStatus.canPresent && styles.buttonDisabled, pressed && paywallStatus.canPresent && styles.pressed]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.buttonShimmer, { opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]}
        />
        <Text style={styles.buttonText}>{paywallStatus.canPresent ? 'Start trial' : 'Purchases unavailable'}</Text>
        <Text style={styles.buttonArrow}>-&gt;</Text>
      </Pressable>

      <View style={styles.footRow}>
        <Text style={styles.footCopy}>Trial and pricing are shown on the Apple purchase sheet. Cancel anytime in Apple subscriptions.</Text>
      </View>
      <Text style={styles.cancelCopy}>Cancel anytime in Settings.</Text>
      <View style={styles.restoreRow}>
        <Text style={styles.footCopy}>Already a member?</Text>
        <Pressable accessibilityLabel="Restore purchases" accessibilityRole="button" hitSlop={6} onPress={() => { void handleRestore(); }}>
          <Text style={styles.footLink}>Restore</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: `${colors.accent}33`,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    overflow: 'hidden',
    padding: 22,
    position: 'relative',
  },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kicker: {
    ...t.eyebrow,
    color: colors.accent,
  },
  trialBadge: {
    ...t.dataSmall,
    backgroundColor: colors.accent,
    borderRadius: 999,
    color: colors.accentInk,
    fontSize: 9,
    letterSpacing: 1.2,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  title: {
    ...t.displaySmall,
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
    marginBottom: 8,
  },
  copy: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
  unavailable: {
    ...t.bodySmall,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.warning,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  grid: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    padding: 14,
    position: 'relative',
  },
  gridItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  gridIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  gridText: {
    ...t.bodySmall,
    color: colors.text,
    flex: 1,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: `${colors.accent}88`,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 44,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonShimmer: {
    ...StyleSheet.absoluteFillObject,
    borderColor: colors.accentSoft,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  buttonText: {
    ...t.label,
    color: colors.accentInk,
    fontSize: 14,
  },
  buttonArrow: {
    color: colors.accentInk,
    fontSize: 14,
  },
  footRow: {
    justifyContent: 'center',
    marginTop: 12,
  },
  restoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
  },
  footCopy: {
    ...t.dataSmall,
    color: colors.textFaint,
    flexShrink: 1,
    lineHeight: 16,
    textAlign: 'center',
  },
  cancelCopy: {
    ...t.dataSmall,
    color: colors.textDim,
    lineHeight: 16,
    marginTop: 6,
    textAlign: 'center',
  },
  footLink: {
    ...t.label,
    color: colors.textMuted,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.85,
  },
  compact: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: `${colors.accent}33`,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  compactDot: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  compactText: {
    ...t.label,
    color: colors.text,
    fontSize: 13,
  },
  compactArrow: {
    color: colors.accent,
    fontSize: 14,
  },
});
