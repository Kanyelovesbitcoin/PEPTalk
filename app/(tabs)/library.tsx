import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarkMark } from '@/components/library/BookmarkMark';
import { BreadthDots } from '@/components/library/BreadthDots';
import { Chip } from '@/components/library/Chip';
import { EvidenceBar } from '@/components/library/EvidenceBar';
import { RefBadge } from '@/components/library/RefBadge';
import { colors } from '@/lib/constants/colors';
import { goals as goalDefs, goalById } from '@/lib/constants/goals';
import { rhythm } from '@/lib/constants/layout';
import { fonts, type as t } from '@/lib/constants/typography';
import { compounds } from '@/lib/data/compounds';
import { getDefaultCompoundTags } from '@/lib/data/compoundTags';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { useAdaptiveLayout } from '@/lib/hooks/useAdaptiveLayout';
import { usePro } from '@/lib/hooks/usePro';
import { hapticSelection } from '@/lib/utils/haptics';
import { showPaywallWithAlert } from '@/lib/utils/paywallAlerts';
import type { Compound, GoalTag } from '@/types/compound';

type Filter = GoalTag | 'all';

const ROUTE_LABEL: Record<string, string> = {
  injection: 'Non-oral',
  nasal: 'Nasal',
  oral: 'Oral',
  sublingual: 'Sublingual',
  topical: 'Topical',
};

function searchCompound(compound: Compound, query: string) {
  if (!query) return true;
  const status = statusLabel(compound);

  const haystack = [
    compound.name,
    compound.nickname,
    compound.summary,
    compound.class,
    compound.origin,
    compound.evidenceLabel,
    compound.legalStatus,
    compound.regulatoryStatus,
    status,
    ...compound.goals,
    ...compound.riskBadges,
    ...getDefaultCompoundTags(compound),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function formatIndex(compound: Compound) {
  return String(compounds.findIndex((item) => item.id === compound.id) + 1).padStart(2, '0');
}

function formatRoute(compound: Compound) {
  return compound.administrationRoutes.map((route) => ROUTE_LABEL[route] ?? route).join(' / ');
}

function evidenceScore(compound: Compound) {
  const evidence = compound.evidence;
  if (!evidence) return 0.25;
  return Math.max(evidence.humanTrials, evidence.preclinical, evidence.cosmetic);
}

function statusLabel(compound: Compound) {
  if (compound.regulatoryStatus === 'compounding-concern') return 'Compounding concern';
  if (compound.legalStatus === 'cosmetic') return 'Cosmetic legal';
  if (compound.legalStatus === 'approved-rx') return 'Prescription';
  if (compound.legalStatus === 'investigational' || compound.regulatoryStatus === 'investigational') {
    return 'Investigational';
  }
  return 'Research-only';
}

export default function LibraryScreen() {
  const layout = useAdaptiveLayout();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isPro, showPaywall } = usePro();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const searchRef = useRef<TextInput>(null);

  const counts = useMemo(() => {
    const tally: Record<string, number> = { all: compounds.length };
    goalDefs.forEach((goal) => {
      tally[goal.id] = compounds.filter((compound) => compound.goals.includes(goal.id)).length;
    });
    return tally;
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCompounds = useMemo(() => {
    return compounds.filter((compound) => {
      if (filter !== 'all' && !compound.goals.includes(filter)) return false;
      return searchCompound(compound, normalizedQuery);
    });
  }, [filter, normalizedQuery]);

  const featured = compounds[0];
  const looksShelf = compounds.filter((compound) => compound.goals.includes('aesthetic')).slice(0, 6);
  const flatMode = filter !== 'all' || normalizedQuery.length > 0;
  const flatTileColumns = layout.isTablet ? 3 : 2;
  const shelfTileColumns = layout.isTablet ? 3 : 2;

  function openCompound(compound: Compound) {
    router.push(`/compound/${compound.id}`);
  }

  function handleBookmark(event: GestureResponderEvent, compound: Compound) {
    event.stopPropagation();
    hapticSelection();
    if (!isPro) {
      void showPaywallWithAlert(showPaywall);
      return;
    }
    toggleFavorite(compound.id);
  }

  function setGoalFilter(nextFilter: Filter) {
    hapticSelection();
    setFilter(nextFilter);
  }

  function toggleSearch() {
    hapticSelection();
    searchRef.current?.focus();
  }

  function clearFilters() {
    hapticSelection();
    setFilter('all');
    setQuery('');
  }

  const activeTitle = filter === 'all' ? 'Search results' : filter === 'aesthetic' ? 'Looks' : goalById[filter].title;
  const pageStyle = [
    styles.page,
    {
      maxWidth: layout.pageMaxWidth,
      paddingHorizontal: layout.screenX,
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={pageStyle}>
        <View style={styles.masthead}>
          <View>
            <Text style={styles.eyebrow}>Library</Text>
            <Text style={styles.mastheadCount}>{compounds.length} research references</Text>
          </View>
          <View style={styles.iconCluster}>
            <HeaderIcon
              accessibilityLabel="Focus library search"
              active={query.length > 0}
              name="search"
              onPress={toggleSearch}
            />
            <HeaderIcon
              accessibilityLabel={filter === 'all' ? 'Filter options' : 'Clear library filters'}
              active={filter !== 'all'}
              name="options-outline"
              onPress={filter === 'all' ? hapticSelection : clearFilters}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.filterRibbon} horizontal showsHorizontalScrollIndicator={false}>
          <Chip accessibilityLabel={`Show all ${counts.all} entries`} label={`All ${counts.all}`} on={filter === 'all'} onPress={() => setGoalFilter('all')} />
          {goalDefs.map((goal) => (
            <Chip
              accessibilityLabel={`Filter by ${goal.title}. ${counts[goal.id] ?? 0} entries`}
              key={goal.id}
              label={`${goal.title} ${counts[goal.id] ?? 0}`}
              on={filter === goal.id}
              onPress={() => setGoalFilter(goal.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.searchWrap}>
          <Ionicons color={colors.accent} name="search" size={15} />
          <TextInput
            ref={searchRef}
            accessibilityLabel="Search library"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search BPC, GHK, cosmetic, research, rx..."
            placeholderTextColor={colors.textDim}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable accessibilityLabel="Clear library search" accessibilityRole="button" hitSlop={10} onPress={() => setQuery('')}>
              <Ionicons color={colors.textDim} name="close-circle" size={16} />
            </Pressable>
          ) : null}
        </View>

        {flatMode ? (
          <View style={styles.section}>
            <CategoryHeader
              count={`${visibleCompounds.length} of ${compounds.length}`}
              onPress={clearFilters}
              title={normalizedQuery ? `Search: ${query.trim()}` : activeTitle}
            />
            {visibleCompounds.length > 0 ? (
              <View style={styles.grid}>
                {visibleCompounds.map((compound) => (
                  <ShelfTile
                    compound={compound}
                    index={formatIndex(compound)}
                    key={compound.id}
                    locked={!isPro}
                    onBookmark={(event) => handleBookmark(event, compound)}
                    onPress={() => openCompound(compound)}
                    saved={isFavorite(compound.id)}
                    columns={flatTileColumns}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No entries match.</Text>
                <Text style={styles.emptyCopy}>Try a different goal, search by nickname, or clear the shelf.</Text>
                <Pressable accessibilityLabel="Clear library filters" accessibilityRole="button" onPress={clearFilters} style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
                  <Text style={styles.emptyButtonText}>Clear filters</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <>
            <HeroCard
              compound={featured}
              index="01"
              locked={!isPro}
              onBookmark={(event) => handleBookmark(event, featured)}
              onPress={() => openCompound(featured)}
              saved={isFavorite(featured.id)}
            />

            <View style={styles.section}>
              <CategoryHeader count={`${looksShelf.length} entries - See all`} onPress={() => setGoalFilter('aesthetic')} title="Looks" />
              <View style={styles.grid}>
                {looksShelf.map((compound) => (
                  <ShelfTile
                    columns={shelfTileColumns}
                    compound={compound}
                    index={formatIndex(compound)}
                    key={compound.id}
                    locked={!isPro}
                    onBookmark={(event) => handleBookmark(event, compound)}
                    onPress={() => openCompound(compound)}
                    saved={isFavorite(compound.id)}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        <Text style={styles.disclaimer}>
          Educational reference only. GlowPep does not diagnose, treat, prescribe, source, dose, or recommend peptide use.
        </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderIcon({
  accessibilityLabel,
  active = false,
  name,
  onPress,
}: {
  accessibilityLabel: string;
  active?: boolean;
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.headerIcon, active && styles.headerIconOn, pressed && styles.pressed]}>
      <Ionicons color={active ? colors.accent : colors.textMuted} name={name} size={18} />
    </Pressable>
  );
}

function CategoryHeader({
  count,
  onPress,
  title,
}: {
  count: string;
  onPress?: () => void;
  title: string | ReactNode;
}) {
  const countNode = (
    <Text style={[styles.categoryMeta, onPress && styles.categoryMetaLink]}>
      {count.toUpperCase()}
      {onPress ? ' ->' : ''}
    </Text>
  );

  return (
    <View style={styles.categoryHead}>
      <Text style={styles.categoryTitle}>{title}</Text>
      {onPress ? (
        <Pressable accessibilityLabel={count} accessibilityRole="button" hitSlop={8} onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
          {countNode}
        </Pressable>
      ) : (
        countNode
      )}
    </View>
  );
}

function HeroCard({
  cardStyle,
  compound,
  index,
  locked,
  onBookmark,
  onPress,
  saved,
}: {
  cardStyle?: StyleProp<ViewStyle>;
  compound: Compound;
  index: string;
  locked: boolean;
  onBookmark: (event: GestureResponderEvent) => void;
  onPress: () => void;
  saved: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Open dossier for ${compound.name}. ${statusLabel(compound)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.hero, cardStyle, pressed && styles.pressed]}>
      <Text pointerEvents="none" style={styles.heroNumber}>{index}</Text>
      <View style={styles.heroTop}>
        <RefBadge label="This week's read" />
        <Pressable
          accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${compound.name}`}
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          hitSlop={8}
          onPress={onBookmark}>
          <BookmarkMark active={saved} locked={locked} />
        </Pressable>
      </View>
      <Text numberOfLines={2} style={styles.heroName}>{compound.name}</Text>
      <Text numberOfLines={1} style={styles.heroNickname}>{compound.nickname}</Text>
      <Text numberOfLines={3} style={styles.heroSummary}>{compound.summary}</Text>
      <View style={styles.heroFooter}>
        <View style={styles.openPill}>
          <Text style={styles.openPillText}>Open dossier {'->'}</Text>
        </View>
        <View style={styles.heroMeta}>
          <StatusTag label={statusLabel(compound)} style={styles.heroStatusTag} />
          <BreadthDots value={compound.breadth} />
          <Text style={styles.heroMetaText}>{compound.evidenceLabel ?? 'Limited'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ShelfTile({
  columns,
  compound,
  index,
  locked,
  onBookmark,
  onPress,
  saved,
}: {
  columns: 2 | 3;
  compound: Compound;
  index: string;
  locked: boolean;
  onBookmark: (event: GestureResponderEvent) => void;
  onPress: () => void;
  saved: boolean;
}) {
  const tileStyle = columns === 3 ? styles.tileThird : styles.tileHalf;

  return (
    <Pressable
      accessibilityLabel={`Open dossier for ${compound.name}. ${statusLabel(compound)}. ${compound.evidenceLabel ?? 'Limited'} evidence`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, tileStyle, pressed && styles.pressed]}>
      <View style={styles.tileTop}>
        <Text style={styles.tileNumber}>No. {index}</Text>
        <Pressable
          accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${compound.name}`}
          accessibilityRole="button"
          accessibilityState={{ selected: saved }}
          hitSlop={8}
          onPress={onBookmark}>
          <BookmarkMark active={saved} locked={locked} size={14} />
        </Pressable>
      </View>
      <Text numberOfLines={2} style={styles.tileName}>{compound.name}</Text>
      <Text numberOfLines={1} style={styles.tileNickname}>{compound.nickname}</Text>
      <StatusTag label={statusLabel(compound)} />
      <View style={styles.tileBottom}>
        <BreadthDots value={compound.breadth} />
        <Text numberOfLines={1} style={styles.tileEvidence}>{compound.evidenceLabel ?? 'Limited'}</Text>
      </View>
      <EvidenceBar label={formatRoute(compound)} value={evidenceScore(compound)} />
    </Pressable>
  );
}

function StatusTag({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.statusTag, style]}>
      <View style={styles.statusDot} />
      <Text numberOfLines={1} style={styles.statusTagText}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryHead: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  categoryMeta: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.1,
    paddingBottom: 3,
    textAlign: 'right',
  },
  categoryMetaLink: {
    color: colors.accent,
  },
  categoryTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.serifLight,
    fontSize: 24,
    letterSpacing: -0.45,
    lineHeight: 29,
    paddingRight: 12,
  },
  content: {
    paddingBottom: rhythm.screenBottomTabs,
    paddingTop: rhythm.screenTop,
  },
  disclaimer: {
    ...t.dataSmall,
    color: colors.textDim,
    lineHeight: 17,
    marginTop: 4,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: colors.accentInk,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  emptyCopy: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  emptyTitle: {
    ...t.displaySmall,
    color: colors.text,
    marginBottom: 8,
  },
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
  },
  filterRibbon: {
    gap: 8,
    paddingTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerIconOn: {
    backgroundColor: 'rgba(212, 168, 75, 0.09)',
    borderColor: 'rgba(212, 168, 75, 0.34)',
  },
  hero: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    minHeight: 304,
    overflow: 'hidden',
    padding: 22,
  },
  heroFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  heroMeta: {
    alignItems: 'flex-end',
    gap: 7,
  },
  heroMetaText: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroName: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 38,
    letterSpacing: -1.25,
    lineHeight: 42,
    marginTop: 28,
    maxWidth: 250,
  },
  heroNickname: {
    color: colors.accentSoft,
    fontFamily: fonts.serif,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 21,
    marginTop: 4,
  },
  heroNumber: {
    color: 'rgba(212, 168, 75, 0.045)',
    fontFamily: fonts.serifLight,
    fontSize: 132,
    fontStyle: 'italic',
    letterSpacing: -7,
    lineHeight: 132,
    position: 'absolute',
    right: 8,
    top: -14,
  },
  heroSummary: {
    color: colors.textMuted,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 15,
    maxWidth: 286,
  },
  heroStatusTag: {
    alignSelf: 'flex-end',
    marginTop: 0,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconCluster: {
    flexDirection: 'row',
    gap: 10,
  },
  masthead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mastheadCount: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  openPill: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 17,
  },
  openPillText: {
    color: colors.accentInk,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.84,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    minHeight: 42,
    paddingVertical: 0,
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 13,
  },
  section: {
    marginTop: 28,
  },
  statusDot: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 4,
    width: 4,
  },
  statusTag: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: 'rgba(212, 168, 75, 0.28)',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    maxWidth: '100%',
    minHeight: 28,
    paddingHorizontal: 9,
  },
  statusTagText: {
    color: colors.accent,
    fontFamily: fonts.monoMedium,
    fontSize: 8,
    letterSpacing: 0.9,
  },
  tile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 208,
    padding: 14,
  },
  tileBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 13,
    marginTop: 'auto',
  },
  tileEvidence: {
    color: colors.textDim,
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tileName: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 22,
    letterSpacing: -0.45,
    lineHeight: 25,
    marginTop: 18,
  },
  tileNickname: {
    color: colors.textMuted,
    fontFamily: fonts.serif,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 5,
  },
  tileNumber: {
    color: colors.accent,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tileHalf: {
    width: '48.5%',
  },
  tileThird: {
    width: '31.75%',
  },
  page: {
    alignSelf: 'center',
    width: '100%',
  },
});
