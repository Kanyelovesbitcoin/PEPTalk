import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

type Tone = 'accent' | 'amber' | 'rose';

interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tone?: Tone;
  onPress?: () => void;
}

const TONES: Record<Tone, { ink: string; chip: string }> = {
  accent: { ink: colors.accent, chip: `${colors.accent}22` },
  amber: { ink: colors.amber, chip: `${colors.amber}22` },
  rose: { ink: colors.rose, chip: `${colors.rose}22` },
};

export function StatTile({
  icon,
  value,
  label,
  tone = 'accent',
  onPress,
}: Readonly<StatTileProps>) {
  const palette = TONES[tone];

  const a11yLabel = `${label}, ${value}`;
  const inner = (
    <>
      <View style={styles.topRow}>
        <View style={[styles.chip, { backgroundColor: palette.chip }]}>
          <Ionicons color={palette.ink} name={icon} size={18} />
        </View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={a11yLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {inner}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={a11yLabel} accessible style={styles.card}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 110,
    padding: 18,
  },
  pressed: {
    opacity: 0.9,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  value: {
    fontFamily: fonts.serifLight,
    color: colors.text,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  label: {
    fontFamily: fonts.sansMedium,
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
