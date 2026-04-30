import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompoundCard } from '@/components/CompoundCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors } from '@/lib/constants/colors';
import { goalById } from '@/lib/constants/goals';
import { compounds } from '@/lib/data/compounds';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { type as t } from '@/lib/constants/typography';
import type { GoalTag } from '@/types/compound';

export default function GoalScreen() {
  const params = useLocalSearchParams<{ goalId: GoalTag }>();
  const goal = goalById[params.goalId];
  const { isFavorite, toggleFavorite } = useFavorites();

  const filteredCompounds = compounds
    .filter((compound) => goal && compound.goals.includes(goal.id))
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={filteredCompounds}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            copy={goal ? 'This goal is ready for compounds as the library grows.' : 'Try going back and picking another goal.'}
            icon={goal ? 'flask-outline' : 'help-circle-outline'}
            kicker={goal ? 'Empty' : 'Not found'}
            secondary={{ label: 'Go back', onPress: () => router.back() }}
            title={goal ? 'No compounds yet' : 'Goal not found'}
            tone={goal ? 'neutral' : 'warning'}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Text style={styles.backLabel}>Back</Text>
              </Pressable>
            </View>
            <View style={[styles.hero, goal ? { borderColor: `${goal.accent}55` } : null]}>
              <View style={[styles.iconWrap, goal ? { borderColor: `${goal.accent}66` } : null]}>
                <Ionicons
                  color={goal?.accent ?? colors.accent}
                  name={(goal?.icon ?? 'flask-outline') as any}
                  size={22}
                />
              </View>
              {goal ? (
                <Text style={[styles.kicker, { color: goal.accent }]}>§ — {goal.shortTitle.toUpperCase()}</Text>
              ) : null}
              <Text style={styles.title}>{goal?.title ?? 'Unknown goal'}</Text>
              <Text style={styles.subtitle}>
                {goal?.description ?? 'We could not match that goal, but the rest of the library is still available.'}
              </Text>
              {goal ? (
                <Text style={styles.count}>
                  {filteredCompounds.length} {filteredCompounds.length === 1 ? 'COMPOUND' : 'COMPOUNDS'} INDEXED
                </Text>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CompoundCard
            compound={item}
            isFavorite={isFavorite(item.id)}
            onPress={() =>
              router.push({
                pathname: '/compound/[compoundId]',
                params: { compoundId: item.id },
              })
            }
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 18,
  },
  headerRow: {
    marginBottom: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
    width: 44,
  },
  kicker: {
    ...t.eyebrow,
    marginBottom: 10,
  },
  title: {
    ...t.display,
    color: colors.text,
    fontSize: 32,
    lineHeight: 36,
    marginBottom: 10,
  },
  subtitle: {
    ...t.body,
    color: colors.textMuted,
  },
  count: {
    ...t.dataSmall,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    color: colors.textFaint,
    marginTop: 18,
    paddingTop: 12,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    padding: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.9,
  },
});
