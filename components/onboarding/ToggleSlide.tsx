import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

import type { SlideConfig } from './types';

type ToggleSlideConfig = Extract<SlideConfig, { kind: 'toggle' }>;

interface ToggleSlideProps {
  onAccept: () => void;
  onDecline: () => void;
  slide: ToggleSlideConfig;
  value?: boolean;
}

export function ToggleSlide({ onAccept, onDecline, slide, value }: ToggleSlideProps) {
  const hasChoice = Boolean(slide.field && slide.secondaryLabel);

  return (
    <View style={styles.wrap}>
      <View style={styles.seal}>
        <Ionicons color={colors.accent} name="shield-checkmark-outline" size={32} />
      </View>
      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.body}>{slide.body}</Text>

      {hasChoice ? (
        <View style={styles.choiceStack}>
          <Pressable
            accessibilityLabel={slide.primaryLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: value === true }}
            onPress={onAccept}
            style={({ pressed }) => [
              styles.choice,
              value === true && styles.choiceSelected,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.choiceIcon, value === true && styles.choiceIconSelected]}>
              <Ionicons
                color={value === true ? colors.accentInk : colors.accent}
                name="notifications-outline"
                size={18}
              />
            </View>
            <Text style={[styles.choiceText, value === true && styles.choiceTextSelected]}>{slide.primaryLabel}</Text>
          </Pressable>

          <Pressable
            accessibilityLabel={slide.secondaryLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: value === false }}
            onPress={onDecline}
            style={({ pressed }) => [
              styles.choice,
              value === false && styles.choiceSelected,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.choiceIcon, value === false && styles.choiceIconSelected]}>
              <Ionicons
                color={value === false ? colors.accentInk : colors.accent}
                name="moon-outline"
                size={18}
              />
            </View>
            <Text style={[styles.choiceText, value === false && styles.choiceTextSelected]}>
              {slide.secondaryLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...t.body,
    color: colors.textMuted,
    lineHeight: 25,
    marginTop: 16,
    maxWidth: 390,
  },
  choice: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 13,
    minHeight: 62,
    padding: 14,
  },
  choiceIcon: {
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  choiceIconSelected: {
    backgroundColor: colors.accent,
  },
  choiceSelected: {
    backgroundColor: `${colors.accent}18`,
    borderColor: colors.accent,
  },
  choiceStack: {
    gap: 10,
    marginTop: 28,
  },
  choiceText: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  choiceTextSelected: {
    color: colors.text,
  },
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.78,
  },
  seal: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${colors.accent}12`,
    borderColor: `${colors.accent}44`,
    borderRadius: 999,
    borderWidth: 1,
    height: 84,
    justifyContent: 'center',
    marginBottom: 28,
    width: 84,
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
