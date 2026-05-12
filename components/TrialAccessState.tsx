import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';

const DEFAULT_MESSAGES = [
  'Building private dossier...',
  'Syncing selected stack...',
  'Preparing research workspace...',
  'Checking trial access...',
];

interface TrialAccessStateProps {
  error?: string | null;
  messages?: string[];
  onContinue?: () => void;
  onRetry?: () => void;
  title?: string;
}

export function TrialAccessState({
  error,
  messages = DEFAULT_MESSAGES,
  onContinue,
  onRetry,
  title = 'Preparing your workspace',
}: TrialAccessStateProps) {
  const [index, setIndex] = useState(0);
  const messageList = messages.length > 0 ? messages : DEFAULT_MESSAGES;

  useEffect(() => {
    if (error) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % messageList.length);
    }, 950);
    return () => clearInterval(timer);
  }, [error, messageList.length]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.wrap}>
        <View style={[styles.mark, error && styles.markError]}>
          {error ? (
            <Ionicons color={colors.danger} name="alert-circle-outline" size={32} />
          ) : (
            <ActivityIndicator color={colors.accent} size="large" />
          )}
        </View>
        <Text style={styles.eyebrow}>{error ? 'ACCESS CHECK' : 'PRIVATE DOSSIER'}</Text>
        <Text style={styles.title}>{error ? 'Trial check took too long.' : title}</Text>
        <Text style={styles.copy}>
          {error ?? messageList[index]}
        </Text>
        {error ? (
          <View style={styles.actions}>
            {onRetry ? (
              <Pressable
                accessibilityLabel="Retry trial check"
                accessibilityRole="button"
                onPress={onRetry}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>Retry</Text>
                <Ionicons color={colors.accentInk} name="refresh" size={17} />
              </Pressable>
            ) : null}
            {onContinue ? (
              <Pressable
                accessibilityLabel="Continue"
                accessibilityRole="button"
                onPress={onContinue}
                style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>Continue</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
    marginTop: 28,
    width: '100%',
  },
  copy: {
    ...t.body,
    color: colors.textMuted,
    marginTop: 14,
    maxWidth: 330,
    textAlign: 'center',
  },
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
    marginTop: 24,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: `${colors.accent}12`,
    borderColor: `${colors.accent}44`,
    borderRadius: 999,
    borderWidth: 1,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  markError: {
    backgroundColor: `${colors.danger}12`,
    borderColor: `${colors.danger}44`,
  },
  pressed: {
    opacity: 0.82,
  },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 18,
  },
  primaryText: {
    color: colors.accentInk,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondary: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  secondaryText: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
  },
  title: {
    ...t.display,
    color: colors.text,
    letterSpacing: 0,
    lineHeight: 34,
    textAlign: 'center',
  },
  wrap: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
