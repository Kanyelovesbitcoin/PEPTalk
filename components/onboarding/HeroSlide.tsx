import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

import type { SlideConfig } from './types';

type HeroSlideConfig = Extract<SlideConfig, { kind: 'hero' }>;

const artIcons: Record<NonNullable<HeroSlideConfig['art']>, keyof typeof Ionicons.glyphMap> = {
  boundary: 'shield-checkmark-outline',
  credibility: 'library-outline',
  dossier: 'folder-open-outline',
  problem: 'layers-outline',
  proof: 'bar-chart-outline',
  promise: 'file-tray-stacked-outline',
  welcome: 'sparkles-outline',
  workflow: 'git-branch-outline',
};

interface HeroSlideProps {
  slide: HeroSlideConfig;
}

export function HeroSlide({ slide }: HeroSlideProps) {
  const artIcon = artIcons[slide.art ?? 'dossier'];

  return (
    <View style={styles.wrap}>
      <View style={styles.artBlock}>
        <View style={styles.artHalo} />
        <View style={styles.fileStack}>
          <View style={styles.fileCardBack} />
          <View style={styles.fileCard}>
            <View style={styles.fileRule} />
            <Ionicons color={colors.accent} name={artIcon} size={34} />
            <View style={styles.fileLineWide} />
            <View style={styles.fileLineShort} />
          </View>
        </View>
      </View>

      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.body}>{slide.body}</Text>

      {slide.points ? (
        <View style={styles.pointGrid}>
          {slide.points.map((point, index) => (
            <View key={point.label} style={styles.pointCard}>
              <View style={styles.pointHead}>
                <Text style={styles.pointNum}>{String(index + 1).padStart(2, '0')}</Text>
                {point.icon ? (
                  <Ionicons color={colors.accent} name={point.icon as keyof typeof Ionicons.glyphMap} size={17} />
                ) : null}
              </View>
              <Text style={styles.pointLabel}>{point.label}</Text>
              <Text style={styles.pointBody}>{point.body}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {slide.stat ? (
        <View style={styles.statPanel}>
          <Text style={styles.statValue}>{slide.stat.value}</Text>
          <View style={styles.statCopy}>
            <Text style={styles.statLabel}>{slide.stat.label}</Text>
            <Text style={styles.statBody}>{slide.stat.body}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  artBlock: {
    alignItems: 'flex-start',
    height: 158,
    justifyContent: 'center',
    marginBottom: 12,
  },
  artHalo: {
    backgroundColor: colors.glow,
    borderRadius: 999,
    height: 142,
    left: 20,
    opacity: 0.72,
    position: 'absolute',
    top: 6,
    transform: [{ scaleX: 1.38 }],
    width: 142,
  },
  body: {
    ...t.body,
    color: colors.textMuted,
    lineHeight: 25,
    marginTop: 16,
    maxWidth: 390,
  },
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
  },
  fileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 20,
    borderWidth: 1,
    height: 126,
    justifyContent: 'center',
    padding: 18,
    width: 132,
  },
  fileCardBack: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 118,
    left: 30,
    position: 'absolute',
    top: 6,
    transform: [{ rotate: '7deg' }],
    width: 124,
  },
  fileLineShort: {
    backgroundColor: colors.textFaint,
    borderRadius: 999,
    height: 2,
    marginTop: 8,
    width: 48,
  },
  fileLineWide: {
    backgroundColor: colors.textFaint,
    borderRadius: 999,
    height: 2,
    marginTop: 18,
    width: 78,
  },
  fileRule: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 2,
    marginBottom: 18,
    width: 34,
  },
  fileStack: {
    height: 136,
    justifyContent: 'center',
    width: 168,
  },
  pointBody: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
  pointCard: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minWidth: 96,
    padding: 14,
  },
  pointGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 26,
  },
  pointHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointLabel: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  pointNum: {
    ...t.dataSmall,
    color: colors.textDim,
  },
  statBody: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginTop: 5,
  },
  statCopy: {
    flex: 1,
  },
  statLabel: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  statPanel: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 18,
    marginTop: 28,
    padding: 18,
  },
  statValue: {
    color: colors.accent,
    fontFamily: fonts.serifLight,
    fontSize: 58,
    lineHeight: 62,
    minWidth: 74,
    textAlign: 'center',
  },
  title: {
    ...t.displayLg,
    color: colors.text,
    letterSpacing: 0,
    lineHeight: 42,
    maxWidth: 390,
  },
  wrap: {
    paddingBottom: 20,
  },
});
