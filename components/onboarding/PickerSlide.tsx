import { StyleSheet, Text, View } from 'react-native';

import { QuizOption } from '@/components/QuizOption';
import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

import type { SlideConfig } from './types';

type PickerSlideConfig = Extract<SlideConfig, { kind: 'picker' }>;

interface PickerSlideProps {
  onChange: (value: string) => void;
  slide: PickerSlideConfig;
  value?: string | number;
}

export function PickerSlide({ onChange, slide, value }: PickerSlideProps) {
  const selectedId = value == null ? '' : String(value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.subtitle}>{slide.subtitle}</Text>

      <View style={styles.options}>
        {slide.options.map((option) => (
          <QuizOption
            description={option.description}
            isSelected={selectedId === option.id}
            key={option.id}
            label={option.label}
            onPress={() => onChange(option.id)}
          />
        ))}
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
  options: {
    marginTop: 26,
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
