import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

import type { SlideConfig } from './types';

type GuidelinesSlideConfig = Extract<SlideConfig, { kind: 'guidelines' }>;

interface GuidelinesSlideProps {
  onChange: (values: string[]) => void;
  slide: GuidelinesSlideConfig;
  values: string[];
}

export function GuidelinesSlide({ onChange, slide, values }: GuidelinesSlideProps) {
  function toggleGuideline(id: string) {
    onChange(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.seal}>
        <Ionicons color={colors.accent} name="shield-checkmark-outline" size={30} />
      </View>
      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      {slide.subtitle ? <Text style={styles.subtitle}>{slide.subtitle}</Text> : null}

      <View style={styles.list}>
        {slide.guidelines.map((guideline) => {
          const selected = values.includes(guideline.id);
          return (
            <Pressable
              accessibilityLabel={guideline.label}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              key={guideline.id}
              onPress={() => toggleGuideline(guideline.id)}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected ? <Ionicons color={colors.accentInk} name="checkmark" size={15} /> : null}
              </View>
              <Text style={styles.rowText}>{guideline.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
  },
  list: {
    gap: 12,
    marginTop: 28,
  },
  pressed: {
    opacity: 0.8,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowSelected: {
    backgroundColor: `${colors.accent}12`,
    borderColor: colors.accent,
  },
  rowText: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
  },
  seal: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${colors.accent}12`,
    borderColor: `${colors.accent}44`,
    borderRadius: 999,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    marginBottom: 24,
    width: 76,
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
