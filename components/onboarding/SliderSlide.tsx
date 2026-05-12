import { StyleSheet, Text, Pressable, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

import type { SlideConfig } from './types';

type SliderSlideConfig = Extract<SlideConfig, { kind: 'slider' }>;

const SCALE_VALUES = Array.from({ length: 11 }, (_, index) => index);

interface SliderSlideProps {
  onChange: (value: number) => void;
  slide: SliderSlideConfig;
  value?: number;
}

export function SliderSlide({ onChange, slide, value }: SliderSlideProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      {slide.subtitle ? <Text style={styles.subtitle}>{slide.subtitle}</Text> : null}

      <View style={styles.readout}>
        <Text style={styles.readoutValue}>{typeof value === 'number' ? value : '--'}</Text>
        <Text style={styles.readoutLabel}>out of 10</Text>
      </View>

      <View style={styles.scale} accessibilityRole="adjustable">
        {SCALE_VALUES.map((item) => {
          const selected = value === item;
          return (
            <Pressable
              accessibilityLabel={`${item} out of 10`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={item}
              onPress={() => onChange(item)}
              style={({ pressed }) => [
                styles.segment,
                selected && styles.segmentSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>{slide.lowLabel}</Text>
        <Text style={[styles.scaleLabel, styles.scaleLabelRight]}>{slide.highLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.78,
  },
  readout: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 10,
    marginTop: 32,
  },
  readoutLabel: {
    ...t.dataSmall,
    color: colors.textMuted,
  },
  readoutValue: {
    color: colors.accent,
    fontFamily: fonts.serifLight,
    fontSize: 82,
    lineHeight: 86,
  },
  scale: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 20,
    width: '100%',
  },
  scaleLabel: {
    ...t.bodySmall,
    color: colors.textMuted,
    flex: 1,
  },
  scaleLabelRight: {
    textAlign: 'right',
  },
  scaleLabels: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 12,
  },
  segment: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  segmentSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  segmentText: {
    color: colors.textMuted,
    fontFamily: fonts.monoMedium,
    fontSize: 12,
  },
  segmentTextSelected: {
    color: colors.accentInk,
  },
  subtitle: {
    ...t.body,
    color: colors.textMuted,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 390,
  },
  title: {
    ...t.display,
    color: colors.text,
    letterSpacing: 0,
    lineHeight: 34,
    maxWidth: 390,
  },
  wrap: {
    paddingBottom: 20,
  },
});
