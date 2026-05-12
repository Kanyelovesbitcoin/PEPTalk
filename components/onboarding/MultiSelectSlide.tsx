import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

import { SelectableChip } from './SelectableChip';
import type { SlideConfig } from './types';

type MultiSelectSlideConfig = Extract<SlideConfig, { kind: 'multi' }>;

interface MultiSelectSlideProps {
  onChange: (value: string[]) => void;
  slide: MultiSelectSlideConfig;
  values: string[];
}

export function MultiSelectSlide({ onChange, slide, values }: MultiSelectSlideProps) {
  const optionById = useMemo(
    () => slide.options.reduce<Record<string, (typeof slide.options)[number]>>((lookup, option) => {
      lookup[option.id] = option;
      return lookup;
    }, {}),
    [slide.options],
  );

  function toggleOption(option: (typeof slide.options)[number]) {
    const selected = values.includes(option.id);
    if (selected) {
      onChange(values.filter((value) => value !== option.id));
      return;
    }

    if (option.exclusive) {
      onChange([option.id]);
      return;
    }

    const withoutExclusive = values.filter((value) => !optionById[value]?.exclusive);
    if (slide.max && withoutExclusive.length >= slide.max) {
      return;
    }

    onChange([...withoutExclusive, option.id]);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.subtitle}>{slide.subtitle}</Text>

      <View style={styles.chips}>
        {slide.options.map((option) => (
          <SelectableChip
            accessibilityLabel={option.description ? `${option.label}. ${option.description}` : option.label}
            key={option.id}
            onPress={() => toggleOption(option)}
            selected={values.includes(option.id)}
            title={option.label}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 26,
  },
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
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
