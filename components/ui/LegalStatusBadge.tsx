import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import type { LegalStatus } from '@/types/compound';

const META: Record<LegalStatus, { label: string; tint: string; ink: string }> = {
  cosmetic: { label: 'COSMETIC · LEGAL', tint: 'rgba(182, 200, 120, 0.16)', ink: colors.success },
  research: { label: 'RESEARCH USE', tint: 'rgba(212, 175, 55, 0.14)', ink: colors.accentSoft },
};

interface LegalStatusBadgeProps {
  status: LegalStatus;
  compact?: boolean;
}

export function LegalStatusBadge({ status, compact = false }: Readonly<LegalStatusBadgeProps>) {
  const meta = META[status];
  return (
    <View style={[styles.pill, { backgroundColor: meta.tint }, compact && styles.compact]}>
      <View style={[styles.dot, { backgroundColor: meta.ink }]} />
      <Text style={[styles.label, { color: meta.ink }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 4,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  label: {
    ...t.eyebrow,
    fontSize: 9,
    letterSpacing: 1.4,
  },
});
