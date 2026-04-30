import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizOption } from '@/components/QuizOption';
import { colors } from '@/lib/constants/colors';
import { goals } from '@/lib/constants/goals';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { type as t } from '@/lib/constants/typography';
import { usePro } from '@/lib/hooks/usePro';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { storage } from '@/lib/utils/storage';

const frustrations = [
  { id: 'conflicting-info', label: 'Too much conflicting advice' },
  { id: 'losing-track', label: 'I want a cleaner tracking system' },
  { id: 'math', label: 'Dosing details are easy to lose' },
  { id: 'beginner', label: 'I want a simple starting point' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const { showPaywall } = usePro();
  const { updateAnswer, resetQuiz } = useQuiz();

  // Selections
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedFrustration, setSelectedFrustration] = useState<string | null>(null);

  async function finishOnboarding() {
    if (finishing) {
      return;
    }

    setFinishing(true);

    resetQuiz();
    if (selectedTarget) {
      updateAnswer('primaryGoal', selectedTarget as any);
    }

    await storage.setItem(STORAGE_KEYS.hasOnboarded, 'true');
    await showPaywall().catch(() => false);
    router.replace('/quiz/1');
  }

  function goNext() {
    if (step === 0 && selectedTarget) {
      setStep(1);
    } else if (step === 1 && selectedFrustration) {
      setStep(2);
    } else if (step === 2) {
      finishOnboarding();
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>GlowPep</Text>
          <Pressable onPress={finishOnboarding} style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.kicker}>STEP 1 OF 3</Text>
              <Text style={styles.headline}>What are you optimizing for?</Text>
              <Text style={styles.subtext}>Choose the outcome you want GlowPep to organize around first. You can refine it later.</Text>
              
              <View style={styles.optionsList}>
                {goals.map((goal) => (
                  <QuizOption
                    key={goal.id}
                    label={goal.title}
                    description={goal.description}
                    isSelected={selectedTarget === goal.id}
                    onPress={() => setSelectedTarget(goal.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.kicker}>STEP 2 OF 3</Text>
              <Text style={styles.headline}>What gets in the way?</Text>
              <Text style={styles.subtext}>We’ll keep the app focused on the problem you actually need solved.</Text>

              <View style={styles.optionsList}>
                {frustrations.map((item) => (
                  <QuizOption
                    key={item.id}
                    label={item.label}
                    isSelected={selectedFrustration === item.id}
                    onPress={() => setSelectedFrustration(item.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.orb} />
              <Text style={styles.kicker}>STEP 3 OF 3</Text>
              <Text style={styles.headline}>Your workspace is ready.</Text>
              <Text style={styles.subtext}>Next, answer the questionnaire for an educational stack shortlist. Nothing is added to tracking until you choose “I want to track this.”</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            disabled={
              finishing ||
              (step === 0 && !selectedTarget) ||
              (step === 1 && !selectedFrustration)
            }
            onPress={goNext}
            style={({ pressed }) => [
              styles.primaryButton,
              (finishing || (step === 0 && !selectedTarget) || (step === 1 && !selectedFrustration)) && styles.primaryButtonDisabled,
              pressed && styles.pressed
            ]}>
            <Text style={styles.primaryButtonText}>{step === 2 ? 'Start questionnaire' : 'Continue'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: { backgroundColor: colors.background, flex: 1, paddingBottom: 18, paddingHorizontal: 20, paddingTop: 12 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  brand: { ...t.label, color: colors.text, fontSize: 18, letterSpacing: 0.6 },
  skipButton: { paddingHorizontal: 10, paddingVertical: 8 },
  skipText: { ...t.label, color: colors.textDim, fontSize: 13 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  stepContainer: { flex: 1, paddingTop: 20 },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 12 },
  headline: { ...t.display, color: colors.text, fontSize: 34, lineHeight: 38, marginBottom: 12 },
  subtext: { ...t.body, color: colors.textMuted, fontSize: 16, lineHeight: 24, marginBottom: 32 },
  optionsList: { flex: 1 },
  orb: { backgroundColor: `${colors.accent}18`, borderRadius: 999, height: 210, position: 'absolute', right: -70, top: -50, width: 210 },
  bottomBar: { marginTop: 16, marginBottom: 16 },
  primaryButton: { backgroundColor: colors.accent, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, width: '100%' },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { ...t.label, color: colors.accentInk, fontSize: 15, textAlign: 'center' },
  pressed: { opacity: 0.86 },
});
