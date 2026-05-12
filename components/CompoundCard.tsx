import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LegalStatusBadge } from '@/components/ui/LegalStatusBadge';
import { ResearchDot } from '@/components/ui/ResearchDot';
import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';
import type { AdministrationRoute, BudgetTier, Compound } from '@/types/compound';

const ROUTE_ICONS: Record<AdministrationRoute, { icon: any; label: string }> = {
  oral: { icon: 'medkit-outline', label: 'ORAL' },
  sublingual: { icon: 'water-outline', label: 'SUB' },
  nasal: { icon: 'cloud-outline', label: 'NASAL' },
  injection: { icon: 'cellular-outline', label: 'NON-ORAL' },
  topical: { icon: 'hand-left-outline', label: 'TOPIC' },
};

const BUDGET_LEVEL: Record<BudgetTier, number> = {
  low: 1,
  mid: 2,
  high: 3,
};

function BudgetScale({ tier }: { tier: BudgetTier }) {
  const level = BUDGET_LEVEL[tier];
  return (
    <View style={styles.pipRow}>
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          style={[
            styles.pip,
            step <= level && styles.pipOn,
            step <= level && tier === 'high' && styles.pipOnHigh,
          ]}
        />
      ))}
    </View>
  );
}

interface CompoundCardProps {
  compound: Compound;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export function CompoundCard({
  compound,
  isFavorite,
  onPress,
  onToggleFavorite,
}: Readonly<CompoundCardProps>) {
  const primaryRoute = compound.administrationRoutes[0];
  const routeMeta = primaryRoute ? ROUTE_ICONS[primaryRoute] : null;

  return (
    <Pressable
      accessibilityLabel={`Open ${compound.name}. ${compound.summary}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.topRow}>
        <LegalStatusBadge status={compound.legalStatus} compact />
        <Pressable
          accessibilityLabel={`${isFavorite ? 'Remove' : 'Save'} ${compound.name}`}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorite }}
          hitSlop={10}
          onPress={onToggleFavorite}
          style={({ pressed }) => [styles.favBtn, pressed && styles.favPressed]}>
          <Ionicons
            color={isFavorite ? colors.accent : colors.textFaint}
            name={isFavorite ? 'bookmark' : 'bookmark-outline'}
            size={14}
          />
        </Pressable>
      </View>

      <Text style={styles.name}>{compound.name}</Text>
      {compound.nickname ? <Text style={styles.alt}>{compound.nickname}</Text> : null}

      <Text style={styles.blurb} numberOfLines={3}>
        {compound.summary}
      </Text>

      <View style={styles.badgeRow}>
        {compound.riskBadges.slice(0, 2).map((badge) => (
          <Text key={badge} numberOfLines={1} style={styles.riskBadge}>{badge}</Text>
        ))}
      </View>

      <View style={styles.meta}>
        <View style={styles.metaCell}>
          <Text style={styles.metaKey}>ROUTE</Text>
          <View style={styles.metaValRow}>
            {routeMeta ? (
              <Ionicons color={colors.textMuted} name={routeMeta.icon} size={12} />
            ) : null}
            <Text style={styles.metaVal}>{routeMeta?.label ?? '-'}</Text>
          </View>
        </View>
        <View style={[styles.metaCell, styles.metaCellMid]}>
          <Text style={styles.metaKey}>EVIDENCE</Text>
          <View style={styles.metaValRow}>
            <ResearchDot status={compound.researchStatus} />
          </View>
        </View>
        <View style={[styles.metaCell, styles.metaCellRight]}>
          <Text style={styles.metaKey}>BREADTH</Text>
          <View style={styles.metaValRow}>
            <BudgetScale tier={compound.budgetTier} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    padding: 20,
  },
  cardPressed: {
    borderColor: colors.borderStrong,
    opacity: 0.95,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classLabel: {
    ...t.eyebrow,
    color: colors.textDim,
  },
  sep: {
    color: colors.textFaint,
  },
  favBtn: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  favPressed: {
    opacity: 0.5,
  },
  favGlyph: {
    color: colors.textFaint,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  favOn: {
    color: colors.accent,
  },
  name: {
    fontFamily: fonts.sansMedium,
    color: colors.text,
    fontSize: 24,
    letterSpacing: -0.45,
    lineHeight: 30,
    marginTop: 12,
  },
  alt: {
    ...t.bodySmall,
    color: colors.textDim,
    marginTop: 2,
  },
  blurb: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
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
  meta: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    flexDirection: 'row',
    marginTop: 16,
    padding: 12,
  },
  metaCell: {
    flex: 1,
  },
  metaCellMid: {
    alignItems: 'center',
  },
  metaCellRight: {
    alignItems: 'flex-end',
  },
  metaKey: {
    ...t.dataSmall,
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  metaVal: {
    ...t.data,
    color: colors.text,
    fontSize: 11,
  },
  metaValRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  pipRow: {
    flexDirection: 'row',
    gap: 3,
  },
  pip: {
    backgroundColor: colors.border,
    borderRadius: 1,
    height: 8,
    width: 4,
  },
  pipOn: {
    backgroundColor: colors.accentSoft,
  },
  pipOnHigh: {
    backgroundColor: colors.amber,
  },
});
