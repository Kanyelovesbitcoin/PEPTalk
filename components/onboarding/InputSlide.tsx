import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

import type { OnboardingAnswers, SlideConfig } from './types';

type InputSlideConfig = Extract<SlideConfig, { kind: 'input' }>;

interface InputSlideProps {
  onChange: <K extends keyof OnboardingAnswers>(field: K, value: OnboardingAnswers[K]) => void;
  slide: InputSlideConfig;
  values: OnboardingAnswers;
}

export function InputSlide({ onChange, slide, values }: InputSlideProps) {
  const ageIsUnder18 = typeof values.age === 'number' && values.age < 18;

  function valueForField(field: (typeof slide.fields)[number]['field']) {
    if (field === 'age') {
      return typeof values.age === 'number' ? String(values.age) : '';
    }

    return values.name ?? '';
  }

  function updateField(field: (typeof slide.fields)[number]['field'], text: string) {
    if (field === 'age') {
      const digits = text.replace(/\D/g, '').slice(0, 3);
      onChange('age', digits ? Number(digits) : undefined);
      return;
    }

    onChange('name', text);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      {slide.subtitle ? <Text style={styles.subtitle}>{slide.subtitle}</Text> : null}

      <View style={styles.fields}>
        {slide.fields.map((field) => (
          <View key={field.field} style={styles.fieldBlock}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              accessibilityLabel={field.label}
              keyboardType={field.keyboardType}
              onChangeText={(text) => updateField(field.field, text)}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textDim}
              returnKeyType="done"
              style={styles.input}
              value={valueForField(field.field)}
            />
            {field.field === 'age' && ageIsUnder18 ? (
              <Text accessibilityLiveRegion="polite" style={styles.warning}>
                GlowPep is restricted to users 18 and older for research safety.
              </Text>
            ) : null}
            {field.helper ? <Text style={styles.helper}>{field.helper}</Text> : null}
          </View>
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
  fieldBlock: {
    gap: 8,
  },
  fields: {
    gap: 18,
    marginTop: 30,
  },
  helper: {
    ...t.bodySmall,
    color: colors.textDim,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  label: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
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
  warning: {
    ...t.bodySmall,
    color: colors.danger,
  },
  wrap: {
    paddingBottom: 20,
  },
});
