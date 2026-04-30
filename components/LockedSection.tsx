import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  { icon: 'sparkles-outline', text: 'Unlimited AI stack matching' },
  { icon: 'document-text-outline', text: 'Full compound notes & protocols' },
  { icon: 'analytics-outline', text: 'Adherence charts & exports' },
  { icon: 'notifications-outline', text: 'Reminders & widgets' },
];

export function LockedSection({
  onPress,
  title = 'Unlock the full system',
  copy = 'AI matching, full notes, schedules, charts, and reminders. Cancel anytime.',
  variant = 'full',
}: LockedSectionProps) {
  const { restorePurchases } = usePro();

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.compact, pressed && styles.pressed]}>
        <View style={styles.compactInner}>
          <Ionicons color={colors.accent} name="lock-closed" size={14} />
          <Text style={styles.compactText}>Unlock with GlowPep Pro</Text>
        </View>
        <Text style={styles.compactArrow}>→</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.head}>
        <Text style={styles.kicker}>§ — PEPTALK PRO</Text>
        <Text style={styles.trialBadge}>7-DAY TRIAL</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>

      <View style={styles.grid}>
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
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Start free trial</Text>
        <Text style={styles.buttonArrow}>→</Text>
      </Pressable>

      <View style={styles.footRow}>
        <Text style={styles.footCopy}>Already a member?</Text>
        <Pressable hitSlop={6} onPress={() => { void restorePurchases(); }}>
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
    padding: 22,
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
    backgroundColor: `${colors.accent}1A`,
    borderColor: `${colors.accent}55`,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.accent,
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
  grid: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    paddingTop: 14,
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
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
  },
  footCopy: {
    ...t.dataSmall,
    color: colors.textFaint,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compactInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
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
