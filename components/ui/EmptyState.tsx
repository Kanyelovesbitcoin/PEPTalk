import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

type Tone = 'neutral' | 'accent' | 'warning' | 'danger';

interface EmptyStateProps {
  kicker?: string;
  subkicker?: string;
  title: string;
  copy?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  cta?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
  compact?: boolean;
  size?: 'standard' | 'illustrated';
  children?: ReactNode;
}

const TONES: Record<Tone, { kicker: string; icon: string; border: string }> = {
  neutral: {
    kicker: colors.textDim,
    icon: colors.textMuted,
    border: colors.border,
  },
  accent: {
    kicker: colors.accent,
    icon: colors.accent,
    border: `${colors.accent}33`,
  },
  warning: {
    kicker: colors.amber,
    icon: colors.amber,
    border: `${colors.amber}40`,
  },
  danger: {
    kicker: colors.danger,
    icon: colors.danger,
    border: `${colors.danger}40`,
  },
};

export function EmptyState({
  kicker,
  subkicker,
  title,
  copy,
  icon,
  tone = 'neutral',
  cta,
  secondary,
  compact = false,
  size = 'standard',
  children,
}: Readonly<EmptyStateProps>) {
  const palette = TONES[tone];
  const illustrated = size === 'illustrated';

  return (
    <View
      style={[
        styles.container,
        compact && styles.compact,
        illustrated && styles.illustrated,
        { borderColor: palette.border },
      ]}>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            illustrated && styles.iconWrapIllustrated,
            { borderColor: palette.border },
          ]}>
          <Ionicons color={palette.icon} name={icon} size={illustrated ? 28 : 18} />
        </View>
      ) : null}
      {kicker ? (
        <Text style={[styles.kicker, { color: palette.kicker }]}>{kicker.toUpperCase()}</Text>
      ) : null}
      <Text style={[styles.title, illustrated && styles.titleIllustrated]}>{title}</Text>
      {subkicker ? <Text style={styles.subkicker}>{subkicker.toUpperCase()}</Text> : null}
      {copy ? <Text style={[styles.copy, illustrated && styles.copyIllustrated]}>{copy}</Text> : null}
      {children}
      {cta || secondary ? (
        <View style={[styles.actions, illustrated && styles.actionsIllustrated]}>
          {cta ? (
            <Pressable
              onPress={cta.onPress}
              style={({ pressed }) => [
                styles.cta,
                illustrated && styles.ctaIllustrated,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.ctaText}>{cta.label}</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </Pressable>
          ) : null}
          {secondary ? (
            <Pressable
              hitSlop={8}
              onPress={secondary.onPress}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
              <Text style={styles.secondaryText}>{secondary.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    padding: 22,
  },
  compact: {
    padding: 18,
  },
  illustrated: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    marginBottom: 14,
    width: 36,
  },
  iconWrapIllustrated: {
    borderRadius: 18,
    height: 64,
    marginBottom: 20,
    width: 64,
  },
  kicker: {
    ...t.eyebrow,
    marginBottom: 10,
  },
  title: {
    ...t.displaySmall,
    color: colors.text,
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 6,
  },
  titleIllustrated: {
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  subkicker: {
    ...t.dataSmall,
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 1.4,
    marginTop: 6,
    textAlign: 'center',
  },
  copy: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
  copyIllustrated: {
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  actionsIllustrated: {
    alignSelf: 'stretch',
    marginTop: 24,
  },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  ctaIllustrated: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  ctaText: {
    ...t.label,
    color: colors.accentInk,
    fontSize: 13,
  },
  ctaArrow: {
    color: colors.accentInk,
    fontSize: 13,
  },
  secondary: {
    paddingVertical: 8,
  },
  secondaryText: {
    ...t.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
});
