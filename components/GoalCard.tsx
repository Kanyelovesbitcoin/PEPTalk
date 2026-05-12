import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import type { GoalDefinition } from '@/lib/constants/goals';
import { type as t } from '@/lib/constants/typography';

interface GoalCardProps {
  goal: GoalDefinition;
  onPress: () => void;
}

export function GoalCard({ goal, onPress }: Readonly<GoalCardProps>) {
  return (
    <Pressable
      accessibilityLabel={`Explore ${goal.title}. ${goal.description}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.iconWrap}>
        <Ionicons color={goal.accent} name={goal.icon as any} size={22} />
      </View>
      <Text style={styles.title}>{goal.title}</Text>
      <Text style={styles.description} numberOfLines={1}>
        {goal.description}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.linkText}>Explore</Text>
        <Text style={styles.arrow}>-&gt;</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 168,
    padding: 20,
  },
  cardPressed: {
    borderColor: colors.borderStrong,
    opacity: 0.95,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.borderStrong,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: 'center',
    marginBottom: 16,
    width: 36,
  },
  title: {
    ...t.label,
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 6,
  },
  description: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  linkText: {
    ...t.bodySmall,
    color: colors.text,
    fontSize: 12,
  },
  arrow: {
    color: colors.text,
    fontSize: 12,
  },
});
