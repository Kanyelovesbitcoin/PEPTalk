import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';
import { compounds } from '@/lib/data/compounds';
import { goals as goalDefs } from '@/lib/constants/goals';
import type { Compound, GoalTag } from '@/types/compound';

type Filter = GoalTag | 'all';

const BUDGET_TIER: Record<Compound['budgetTier'], number> = {
  low: 1,
  mid: 2,
  high: 3,
};

const ROUTE_LABEL: Record<string, string> = {
  oral: 'Oral',
  sublingual: 'Sublingual',
  nasal: 'Nasal',
  injection: 'Injection',
  topical: 'Topical',
};

const EVIDENCE_LABEL: Record<Compound['researchStatus'], string> = {
  'well-studied': 'Well studied',
  promising: 'Promising',
  'early-research': 'Early research',
};

export default function LibraryScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => {
    const tally: Record<string, number> = { all: compounds.length };
    goalDefs.forEach((g) => {
      tally[g.id] = compounds.filter((c) => c.goals.includes(g.id)).length;
    });
    return tally;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return compounds.filter((c) => {
      if (filter !== 'all' && !c.goals.includes(filter)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.nickname.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Masthead */}
        <View style={styles.head}>
          <Text style={styles.eyebrow}>
            <Text style={styles.eyebrowDot}>● </Text>INDEX
          </Text>
          <Text style={styles.title}>
            Peptide{'\n'}
            <Text style={styles.titleAccent}>library</Text>
          </Text>
          <View style={styles.subRow}>
            <Text style={styles.intro}>Choose peptides you actually use or want to follow. Add them from the detail page.</Text>
            <Text style={styles.count}>
              {filter === 'all' && !query ? `${compounds.length} entries` : `${filtered.length} of ${compounds.length}`}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons color={colors.textDim} name="search" size={14} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search peptides…"
            placeholderTextColor={colors.textDim}
            style={styles.searchInput}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          <FilterChip
            active={filter === 'all'}
            label="ALL"
            count={counts.all}
            onPress={() => setFilter('all')}
          />
          {goalDefs.map((g) => (
            <FilterChip
              key={g.id}
              active={filter === g.id}
              label={g.title.toUpperCase()}
              count={counts[g.id] ?? 0}
              onPress={() => setFilter(g.id)}
            />
          ))}
        </ScrollView>
        <View style={styles.ruleBold} />

        {/* Entries */}
        {filtered.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/compound/${c.id}`)}
            style={styles.entry}>
            <View style={styles.entryHead}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={styles.entryNum}>N° {String(i + 1).padStart(2, '0')}</Text>
                <View
                  style={[
                    styles.pill,
                    c.legalStatus === 'research'
                      ? { borderColor: 'rgba(224,98,63,0.4)' }
                      : { borderColor: 'rgba(212,168,75,0.4)' },
                  ]}>
                  <Text
                    style={[
                      styles.pillText,
                      { color: c.legalStatus === 'research' ? colors.crimson : colors.accent },
                    ]}>
                    {c.legalStatus === 'research' ? 'RESEARCH USE' : 'COSMETIC · LEGAL'}
                  </Text>
                </View>
              </View>
              <Ionicons color={colors.textDim} name="bookmark-outline" size={14} />
            </View>
            <Text style={styles.entryName}>{c.name}</Text>
            <Text style={styles.entryAka}>{c.nickname}</Text>
            <Text style={styles.entryDesc}>{c.summary}</Text>

            <View style={styles.spec}>
              <SpecRow k="Route" v={c.administrationRoutes.map((r) => ROUTE_LABEL[r] ?? r).join(' / ')} />
              <SpecRow k="Evidence" v={EVIDENCE_LABEL[c.researchStatus]} />
              <SpecRow
                k="Budget"
                v={
                  <View style={styles.dotMeter}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <View
                        key={j}
                        style={[
                          styles.dot,
                          j < BUDGET_TIER[c.budgetTier] && { backgroundColor: colors.accent },
                        ]}
                      />
                    ))}
                  </View>
                }
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
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
    <Pressable onPress={onPress} style={styles.chip}>
      <Text style={[styles.chipLabel, active && { color: colors.text }]}>{label}</Text>
      <View
        style={[
          styles.chipCount,
          active && {
            borderColor: 'rgba(212,168,75,0.3)',
            backgroundColor: 'rgba(212,168,75,0.1)',
          },
        ]}>
        <Text style={[styles.chipCountText, active && { color: colors.accent }]}>{count}</Text>
      </View>
      {active ? <View style={styles.chipUnderline} /> : null}
    </Pressable>
  );
}

function SpecRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specK}>{k}</Text>
      <View style={styles.specV}>
        {typeof v === 'string' ? <Text style={styles.specVText}>{v}</Text> : v}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  scroll: { paddingBottom: 140 },

  head: { paddingHorizontal: 22, paddingTop: 12 },
  eyebrow: { ...t.eyebrow, color: colors.textDim },
  eyebrowDot: { color: colors.accent, fontSize: 8 },
  title: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.4,
    marginTop: 6,
  },
  titleAccent: { color: colors.accent },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14 },
  intro: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, maxWidth: 240, lineHeight: 19 },
  count: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1 },

  searchWrap: {
    marginHorizontal: 22,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.sans, fontSize: 14 },

  filterRow: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 18 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 14, paddingBottom: 8, position: 'relative' },
  chipLabel: { color: colors.textDim, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.4 },
  chipCount: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipCountText: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 9 },
  chipUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 14,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.accent,
  },

  ruleBold: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },

  entry: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 22,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  entryNum: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: StyleSheet.hairlineWidth },
  pillText: { fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 1.4 },
  entryName: {
    color: colors.text,
    fontFamily: fonts.serifLight,
    fontSize: 30,
    letterSpacing: -1.2,
    lineHeight: 32,
    marginBottom: 6,
  },
  entryAka: { color: colors.textDim, fontFamily: fonts.sansMedium, fontSize: 13, marginBottom: 14 },
  entryDesc: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, marginBottom: 18 },

  spec: { backgroundColor: colors.backgroundAlt, borderRadius: 14, marginTop: 4, paddingHorizontal: 12 },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  specK: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4 },
  specV: { alignItems: 'flex-end' },
  specVText: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 13 },

  dotMeter: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 50, backgroundColor: colors.textFaint },
});
