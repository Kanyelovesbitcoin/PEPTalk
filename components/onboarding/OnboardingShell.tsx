import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

import { PrimaryCTA } from './PrimaryCTA';
import { ProgressRail } from './ProgressRail';

interface OnboardingShellProps {
  children: ReactNode;
  ctaDisabled?: boolean;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  ctaLabel: string;
  ctaLoading?: boolean;
  index: number;
  onBack: () => void;
  onCtaPress: () => void;
  onSkip: () => void;
  showCta?: boolean;
  total: number;
}

export function OnboardingShell({
  children,
  ctaDisabled = false,
  ctaIcon,
  ctaLabel,
  ctaLoading = false,
  index,
  onBack,
  onCtaPress,
  onSkip,
  showCta = true,
  total,
}: OnboardingShellProps) {
  const canGoBack = index > 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}>
        <View style={styles.shell}>
          <View pointerEvents="none" style={styles.topGlow} />

          <View style={styles.header}>
            <View style={styles.brandCluster}>
              {canGoBack ? (
                <Pressable
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={onBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                  <Ionicons color={colors.text} name="chevron-back" size={19} />
                </Pressable>
              ) : null}
              <BrandLogo height={31} width={25} />
              <View>
                <Text style={styles.brand}>GLOWPEP</Text>
                <Text accessibilityLiveRegion="polite" style={styles.stepText}>
                  Step {index + 1} of {total}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel="Skip onboarding"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onSkip}
              style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <ProgressRail index={index} total={total} />

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          {showCta ? (
            <PrimaryCTA
              disabled={ctaDisabled}
              icon={ctaIcon}
              label={ctaLabel}
              loading={ctaLoading}
              onPress={onCtaPress}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  brand: {
    ...t.dataSmall,
    color: colors.text,
    fontFamily: fonts.monoMedium,
    letterSpacing: 1.4,
  },
  brandCluster: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 10,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 26,
    paddingTop: 30,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    minHeight: 44,
  },
  keyboardWrap: {
    flex: 1,
  },
  pressed: {
    opacity: 0.78,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  shell: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: 'hidden',
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skipButton: {
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
    paddingLeft: 14,
  },
  skipText: {
    color: colors.textMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  stepText: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  topGlow: {
    backgroundColor: colors.accent,
    borderRadius: 260,
    height: 360,
    opacity: 0.075,
    position: 'absolute',
    right: -140,
    top: -230,
    transform: [{ scaleX: 1.25 }],
    width: 520,
  },
});
