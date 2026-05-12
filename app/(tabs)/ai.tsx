import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LegalStatusBadge } from '@/components/ui/LegalStatusBadge';
import { colors } from '@/lib/constants/colors';
import { goals as goalDefs } from '@/lib/constants/goals';
import { rhythm } from '@/lib/constants/layout';
import { fonts, type as t } from '@/lib/constants/typography';
import { compounds } from '@/lib/data/compounds';
import { useAdaptiveLayout } from '@/lib/hooks/useAdaptiveLayout';
import { hapticSelection } from '@/lib/utils/haptics';
import type { Compound, GoalTag } from '@/types/compound';

type Filter = GoalTag | 'all';

export default function PeptidesScreen() {
  const layout = useAdaptiveLayout();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const tally: Record<string, number> = { all: compounds.length };
    goalDefs.forEach((goal) => {
      tally[goal.id] = compounds.filter((compound) => compound.goals.includes(goal.id)).length;
    });
    return tally;
  }, []);

  const filteredCompounds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return compounds.filter((compound) => {
      if (filter !== 'all' && !compound.goals.includes(filter)) return false;
      if (!normalizedQuery) return true;

      return (
        compound.name.toLowerCase().includes(normalizedQuery)
        || compound.nickname.toLowerCase().includes(normalizedQuery)
        || compound.summary.toLowerCase().includes(normalizedQuery)
        || compound.riskBadges.some((badge) => badge.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [filter, query]);

  const listHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PEPTIDE GUIDE</Text>
        <Text style={styles.title}>Peptides</Text>
        <Text style={styles.intro}>
          Browse calm educational references, compare context, and open each guide when you want deeper detail.
        </Text>
        <View style={styles.statRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{compounds.length}</Text>
            <Text style={styles.statLabel}>references</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{goalDefs.length}</Text>
            <Text style={styles.statLabel}>goals</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons color={colors.textDim} name="search" size={15} />
        <TextInput
          accessibilityLabel="Search peptide references"
          onChangeText={setQuery}
          placeholder="Search peptides..."
          placeholderTextColor={colors.textDim}
          style={styles.searchInput}
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityLabel="Clear peptide search"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setQuery('')}
            style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
            <Ionicons color={colors.textMuted} name="close" size={15} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.filterRow}
        horizontal
        showsHorizontalScrollIndicator={false}>
        <FilterChip
          active={filter === 'all'}
          count={counts.all}
          label="All"
          onPress={() => {
            hapticSelection();
            setFilter('all');
          }}
        />
        {goalDefs.map((goal) => (
          <FilterChip
            active={filter === goal.id}
            count={counts[goal.id] ?? 0}
            key={goal.id}
            label={goal.title}
            onPress={() => {
              hapticSelection();
              setFilter(goal.id);
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.notice}>
        <Ionicons color={colors.accent} name="information-circle-outline" size={16} />
        <Text style={styles.noticeText}>
          Peptides are educational references for organization and personal tracking notes, not dosing or treatment guidance.
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlatList
        contentContainerStyle={[styles.listContent, { maxWidth: layout.pageMaxWidth }]}
        data={filteredCompounds}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No peptide references found.</Text>
            <Text style={styles.emptyCopy}>Try a different search or clear the current filter.</Text>
            <Pressable
              accessibilityLabel="Clear peptide filters"
              accessibilityRole="button"
              onPress={() => {
                hapticSelection();
                setQuery('');
                setFilter('all');
              }}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
              <Text style={styles.emptyButtonText}>Clear filters</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          filteredCompounds.length ? (
            <Pressable
              accessibilityLabel="Explore the peptide library"
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/library')}
              style={({ pressed }) => [styles.libraryLink, pressed && styles.pressed]}>
              <View>
                <Text style={styles.libraryLinkKicker}>DEEPER CONTEXT</Text>
                <Text style={styles.libraryLinkTitle}>Explore library</Text>
              </View>
              <Ionicons color={colors.accent} name="book-outline" size={20} />
            </Pressable>
          ) : null
        }
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <PeptideQuickCard
            compound={item}
            onLearn={() => router.push(`/compound/${item.id}`)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function FilterChip({
  active,
  label,
  count,
  onPress,
}: {
  active: boolean;
  label: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label}, ${count} references`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.filterChip, active && styles.filterChipActive, pressed && styles.pressed]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
      <Text style={[styles.filterChipCount, active && styles.filterChipCountActive]}>{count}</Text>
    </Pressable>
  );
}

function PeptideQuickCard({
  compound,
  onLearn,
}: {
  compound: Compound;
  onLearn: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Pressable
          accessibilityLabel={`Learn about ${compound.name}`}
          accessibilityRole="button"
          onPress={onLearn}
          style={({ pressed }) => [styles.learnButton, pressed && styles.pressed]}>
          <Text style={styles.learnButtonText}>Learn</Text>
          <Ionicons color={colors.textMuted} name="arrow-forward" size={14} />
        </Pressable>
        <LegalStatusBadge status={compound.legalStatus} compact />
      </View>

      <Text style={styles.cardName}>{compound.name}</Text>
      {compound.nickname ? <Text style={styles.cardNickname}>{compound.nickname}</Text> : null}
      <Text numberOfLines={2} style={styles.cardSummary}>{compound.summary}</Text>

      <View style={styles.badgeRow}>
        {compound.riskBadges.slice(0, 2).map((badge) => (
          <Text key={badge} numberOfLines={1} style={styles.riskBadge}>{badge}</Text>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  listContent: { alignSelf: 'center', paddingBottom: rhythm.screenBottomTabs, width: '100%' },
  header: {
    alignItems: 'center',
    paddingHorizontal: rhythm.screenX,
    paddingTop: rhythm.screenTop,
  },
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 42,
    letterSpacing: -1.2,
    lineHeight: 46,
    marginTop: 8,
    textAlign: 'center',
  },
  intro: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 340,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 18,
  },
  statCell: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 102,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statValue: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 28,
    lineHeight: 30,
  },
  statLabel: {
    ...t.dataSmall,
    color: colors.textDim,
    marginTop: 2,
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: rhythm.screenX,
    marginTop: 20,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    minHeight: 44,
  },
  clearButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: rhythm.screenX,
    paddingTop: 16,
  },
  filterChip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: `${colors.accent}20`,
    borderColor: `${colors.accent}66`,
  },
  filterChipText: {
    color: colors.textMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  filterChipTextActive: {
    color: colors.text,
  },
  filterChipCount: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
  },
  filterChipCountActive: {
    color: colors.accent,
  },
  notice: {
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: rhythm.screenX,
    marginTop: 16,
    padding: 14,
  },
  noticeText: {
    ...t.bodySmall,
    color: colors.textMuted,
    flex: 1,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: rhythm.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: rhythm.screenX,
    marginTop: 14,
    padding: rhythm.cardPadding,
  },
  cardTop: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  cardName: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 30,
    letterSpacing: -0.8,
    lineHeight: 34,
    textAlign: 'center',
  },
  cardNickname: {
    ...t.bodySmall,
    color: colors.textDim,
    marginTop: 2,
    textAlign: 'center',
  },
  cardSummary: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
    marginTop: 14,
  },
  riskBadge: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.textMuted,
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.6,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  learnButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 15,
  },
  learnButtonText: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  libraryLink: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: rhythm.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: rhythm.screenX,
    marginTop: 18,
    padding: rhythm.cardPadding,
  },
  libraryLinkKicker: {
    ...t.dataSmall,
    color: colors.accent,
  },
  libraryLinkTitle: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    marginTop: 4,
  },
  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: rhythm.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: rhythm.screenX,
    marginTop: 18,
    padding: rhythm.cardPadding,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 28,
    letterSpacing: -0.8,
  },
  emptyCopy: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginTop: 8,
  },
  emptyButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  emptyButtonText: {
    color: colors.accentInk,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  pressed: { opacity: 0.84 },
});
