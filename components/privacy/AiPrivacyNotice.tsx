import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';

interface AiPrivacyNoticeProps {
  onAccept: () => void;
  onCancel: () => void;
}

export function AiPrivacyNotice({ onAccept, onCancel }: AiPrivacyNoticeProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.kicker}>AI PRIVACY</Text>
        <Text style={styles.title}>Before AI builds your stack.</Text>
        <Text style={styles.copy}>
          Your quiz answers are sent to the AI provider so GlowPep can generate personalized educational reasoning. Tracker data stays local unless you choose to sync or export it.
        </Text>
        <Text style={styles.copy}>This is education only, not medical advice.</Text>
        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Not now</Text>
          </Pressable>
          <Pressable onPress={onAccept} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>I understand</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.borderStrong,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    width: '100%',
  },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 10 },
  title: { ...t.displaySmall, color: colors.text, fontSize: 26, lineHeight: 30, marginBottom: 10 },
  copy: { ...t.bodySmall, color: colors.textMuted, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  primaryButton: { backgroundColor: colors.accent, borderRadius: 13, flex: 1, paddingVertical: 13 },
  primaryText: { ...t.label, color: colors.accentInk, textAlign: 'center' },
  secondaryButton: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, flex: 1, paddingVertical: 13 },
  secondaryText: { ...t.label, color: colors.textMuted, textAlign: 'center' },
  pressed: { opacity: 0.84 },
});
