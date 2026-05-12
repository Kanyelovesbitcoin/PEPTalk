import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

interface SkinQuizCtaProps {
  hasCompletedResult: boolean;
  onPress: () => void;
}

export function SkinQuizCta({ hasCompletedResult, onPress }: SkinQuizCtaProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.pill}>One-time analysis</Text>
      <Text style={styles.title}>
        {hasCompletedResult ? 'Your personalized skin protocol is ready' : 'Get your personalized skin protocol'}
      </Text>
      <Text style={styles.subtitle}>
        {hasCompletedResult
          ? 'Review your one-time skin quiz result and revisit your cosmetic peptide recommendations.'
          : "Answer a few questions about your skin - stress, sun, acne, redness, oiliness - and we'll recommend the legal cosmetic peptides that match."}
      </Text>
      <Pressable
        accessibilityLabel={hasCompletedResult ? 'View skin quiz results' : 'Start skin quiz'}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>{hasCompletedResult ? 'View results' : 'Start skin quiz ->'}</Text>
        <Ionicons color={colors.accentInk} name="arrow-forward" size={17} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: `${colors.accent}66`,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    padding: 18,
  },
  pill: {
    ...t.dataSmall,
    alignSelf: 'flex-start',
    backgroundColor: `${colors.accent}1f`,
    borderColor: `${colors.accent}77`,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.accent,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 33,
    letterSpacing: -0.5,
    lineHeight: 37,
  },
  subtitle: {
    ...t.bodySmall,
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  buttonText: {
    ...t.label,
    color: colors.accentInk,
    fontSize: 14,
  },
  pressed: { opacity: 0.84 },
});
