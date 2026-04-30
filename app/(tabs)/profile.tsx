import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { fonts, type as t } from '@/lib/constants/typography';
import { useCosmeticDisclaimer } from '@/lib/hooks/useCosmeticDisclaimer';
import { usePro } from '@/lib/hooks/usePro';
import { storage } from '@/lib/utils/storage';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [profileReady, setProfileReady] = useState(false);
  const { isPro, showPaywall, restorePurchases, showCustomerCenter } = usePro();
  const [showCosmeticDisclaimer, setShowCosmeticDisclaimer] = useCosmeticDisclaimer();

  useEffect(() => {
    storage.getItem(STORAGE_KEYS.profileName).then((stored) => {
      if (stored) setName(stored);
      setProfileReady(true);
    });
  }, []);

  useEffect(() => {
    if (!profileReady) return;
    storage.setItem(STORAGE_KEYS.profileName, name);
  }, [name, profileReady]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.sectionNum}>§ — PROFILE</Text>
          <Text style={styles.title}>Local profile.</Text>
          <Text style={styles.sub}>
            A lightweight on-device profile. Stored in iCloud, syncs across your iOS
            devices automatically. No login.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelKicker}>NAME · OPTIONAL</Text>
          <TextInput
            onChangeText={setName}
            placeholder="What should we call you?"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            value={name}
          />
        </View>

        <View style={styles.panel}>
          <View style={styles.statusRow}>
            <Text style={styles.panelKicker}>PRO STATUS</Text>
            <View style={[styles.statusBadge, isPro && styles.statusBadgePro]}>
              <Text style={[styles.statusBadgeText, isPro && styles.statusBadgeTextPro]}>
                {isPro ? '● PRO' : '○ FREE'}
              </Text>
            </View>
          </View>
          <Text style={styles.copy}>
            {isPro
              ? 'You have full access to the quiz, AI insights, and deep compound details.'
              : 'Upgrade to Pro for personalized quiz results, AI insights, and full compound breakdowns.'}
          </Text>
          {isPro ? (
            <Pressable
              onPress={showCustomerCenter}
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
              <Text style={styles.ghostBtnText}>Manage subscription  →</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={showPaywall}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
              <Text style={styles.primaryBtnText}>Upgrade to Pro  →</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.panel}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleBody}>
              <Text style={styles.panelKicker}>COSMETIC PROJECTION NOTE</Text>
              <Text style={styles.copy}>
                Show a one-line note under each scan that scores are a cosmetic projection, not medical advice.
              </Text>
            </View>
            <Switch
              ios_backgroundColor={colors.surface}
              onValueChange={setShowCosmeticDisclaimer}
              thumbColor={showCosmeticDisclaimer ? colors.accentInk : colors.text}
              trackColor={{ false: colors.surface, true: colors.accent }}
              value={showCosmeticDisclaimer}
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelKicker}>APP INFO</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaKey}>VERSION</Text>
              <Text style={styles.metaVal}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
            </View>
            <View style={[styles.metaCell, styles.metaCellBordered]}>
              <Text style={styles.metaKey}>STORAGE</Text>
              <Text style={styles.metaVal}>iCloud</Text>
            </View>
            <View style={[styles.metaCell, styles.metaCellBordered]}>
              <Text style={styles.metaKey}>AUTH</Text>
              <Text style={styles.metaVal}>None</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              onPress={async () => {
                const restored = await restorePurchases();
                Alert.alert(
                  restored ? 'Restored' : 'Nothing to restore',
                  restored
                    ? 'Your Pro access has been restored.'
                    : 'No previous purchases were found for this account.',
                );
              }}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <Text style={styles.secondaryBtnText}>Restore purchases</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Rate GlowPep', 'Add your App Store review URL when the listing is live.')
              }
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
              <Text style={styles.secondaryBtnText}>Rate app</Text>
            </Pressable>
          </View>
        </View>
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
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 20,
  },
  sectionNum: {
    ...t.sectionNum,
    color: colors.textFaint,
    marginBottom: 12,
  },
  title: {
    ...t.display,
    color: colors.text,
    fontSize: 36,
    lineHeight: 40,
  },
  sub: {
    ...t.bodySmall,
    color: colors.textDim,
    marginTop: 8,
  },

  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    padding: 20,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  toggleBody: {
    flex: 1,
  },
  panelKicker: {
    ...t.eyebrow,
    color: colors.textDim,
    marginBottom: 14,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  copy: {
    ...t.bodySmall,
    color: colors.textMuted,
  },

  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...t.eyebrow,
    color: colors.textDim,
    fontSize: 9,
  },
  statusBadgePro: {
    borderColor: colors.accent,
  },
  statusBadgeTextPro: {
    color: colors.accent,
  },

  primaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 10,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtnText: {
    ...t.label,
    color: colors.accentInk,
    fontSize: 13,
  },
  ghostBtn: {
    alignSelf: 'flex-start',
    borderColor: colors.borderStrong,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ghostBtnText: {
    ...t.label,
    color: colors.textMuted,
    fontSize: 13,
  },

  metaGrid: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingTop: 14,
  },
  metaCell: {
    flex: 1,
  },
  metaCellBordered: {
    borderLeftColor: colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: 14,
  },
  metaKey: {
    ...t.eyebrow,
    color: colors.textFaint,
    fontSize: 9,
  },
  metaVal: {
    ...t.data,
    color: colors.text,
    marginTop: 4,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  secondaryBtn: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    ...t.bodySmall,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
