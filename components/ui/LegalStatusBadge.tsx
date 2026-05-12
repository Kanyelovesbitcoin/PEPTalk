import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import type { LegalStatus } from '@/types/compound';

const META: Record<LegalStatus, { label: string; tint: string; ink: string }> = {
  'approved-rx': { label: 'FDA-approved Rx', tint: `${colors.accent}14`, ink: colors.accentSoft },
  cosmetic: { label: 'Cosmetic reference', tint: `${colors.accent}14`, ink: colors.accentSoft },
  investigational: { label: 'Investigational', tint: colors.textFaint, ink: colors.textMuted },
  research: { label: 'Research reference', tint: `${colors.accent}14`, ink: colors.accentSoft },
};

interface LegalStatusBadgeProps {
  status: LegalStatus;
  compact?: boolean;
}

export function LegalStatusBadge({ status, compact = false }: Readonly<LegalStatusBadgeProps>) {
  const meta = META[status];
  return (
    <View style={[styles.pill, { backgroundColor: meta.tint }, compact && styles.compact]}>
      <View style={[styles.dot, { backgroundColor: meta.ink }, compact && styles.compactDot]} />
      <Text style={[styles.label, { color: meta.ink }, compact && styles.compactLabel]}>{meta.label}</Text>
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
    gap: 4,
    paddingHorizontal: 5,
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
    letterSpacing: 0.4,
    textTransform: 'none',
  },
  compactDot: {
    height: 4,
    width: 4,
  },
  compactLabel: {
    fontSize: 8,
    letterSpacing: 1,
  },
});
