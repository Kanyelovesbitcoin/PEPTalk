import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

interface DisclaimerProps {
  expanded?: boolean;
}

export function Disclaimer({ expanded = false }: DisclaimerProps) {
  return (
    <View style={[styles.container, expanded ? styles.expanded : styles.compact]}>
      <Text style={styles.kicker}>
        {expanded ? '§ — DISCLAIMER' : 'EDUCATION ONLY'}
      </Text>
      <Text style={styles.text}>
        GlowPep is for education only. This is not medical advice. Always consult a
        healthcare provider before starting any supplement or peptide.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
  },
  compact: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  expanded: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  kicker: {
    ...t.eyebrow,
    color: colors.textDim,
    marginBottom: 8,
  },
  text: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
});
