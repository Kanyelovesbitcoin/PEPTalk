import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

interface OnboardingStepProps {
  kicker?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function OnboardingStep({ kicker, title, description, children }: Readonly<OnboardingStepProps>) {
  return (
    <View style={styles.container}>
      {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  kicker: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
  },
  title: {
    ...t.displayLg,
    color: colors.text,
    letterSpacing: 0,
    lineHeight: 42,
  },
  description: {
    ...t.body,
    color: colors.textMuted,
    lineHeight: 24,
    marginTop: 14,
  },
  content: {
    marginTop: 24,
  },
});
