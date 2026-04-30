import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LockedSection } from '@/components/LockedSection';
import { colors } from '@/lib/constants/colors';
import { fonts } from '@/lib/constants/typography';
import { useAiPreview } from '@/lib/hooks/useAiPreview';
import { usePro } from '@/lib/hooks/usePro';
import { useQuiz } from '@/lib/hooks/useQuiz';

export default function QuizIntroScreen() {
  const { isPro, showPaywall } = usePro();
  const { freeAiStackUsed } = useAiPreview();
  const { resetQuiz, savedStacks } = useQuiz();
  const canStartQuiz = isPro || !freeAiStackUsed;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace('/(tabs)/ai')}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={20} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.kicker}>{isPro ? 'Pro' : freeAiStackUsed ? 'Pro feature' : 'Free preview'}</Text>
          <Text style={styles.title}>Get your GlowPep stack</Text>
          <Text style={styles.subtitle}>
            Answer 10 quick questions and we&apos;ll build a personalized stack with AI-powered insights tailored to your goals.
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Goal-first scoring tuned to your profile</Text>
            <Text style={styles.listItem}>• AI-generated explanations for every recommendation</Text>
            <Text style={styles.listItem}>• Save your results locally and revisit them anytime</Text>
          </View>
          {canStartQuiz ? (
            <Pressable
              onPress={() => {
                resetQuiz();
                router.push('/quiz/1');
              }}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>{isPro ? 'Start Quiz' : 'Use Free AI Preview'}</Text>
            </Pressable>
          ) : (
            <LockedSection onPress={showPaywall} />
          )}
        </View>

        {savedStacks[0] ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/quiz/results',
                params: { stackId: savedStacks[0].id },
              })
            }
            style={({ pressed }) => [styles.secondaryCard, pressed && styles.pressed]}>
            <Text style={styles.secondaryTitle}>Open latest saved stack</Text>
            <Text style={styles.secondaryCopy}>Jump straight back into the last result you saved on this device.</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 150,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 30,
    letterSpacing: -0.7,
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    marginTop: 18,
  },
  listItem: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryCard: {
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
    padding: 18,
  },
  secondaryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  secondaryCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.9,
  },
});
