import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors } from '@/lib/constants/colors';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { fonts, type as t } from '@/lib/constants/typography';
import { useAdaptiveLayout } from '@/lib/hooks/useAdaptiveLayout';
import { usePro, type DevAccessMode } from '@/lib/hooks/usePro';
import { showPaywallWithAlert } from '@/lib/utils/paywallAlerts';
import { clearAllLocalAppData } from '@/lib/utils/resetAppData';
import { storage } from '@/lib/utils/storage';

const DEV_MODES: DevAccessMode[] = ['free', 'live', 'pro'];

export default function ProfileScreen() {
  const layout = useAdaptiveLayout();
  const [name, setName] = useState('');
  const [profileReady, setProfileReady] = useState(false);
  const {
    devAccessMode,
    isPro,
    paywallStatus,
    restorePurchases,
    setDevAccessMode,
    showCustomerCenter,
    showPaywall,
  } = usePro();
  const appStoreReviewUrl = Constants.expoConfig?.extra?.appStoreReviewUrl as string | undefined;
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: layout.readableMaxWidth,
            paddingHorizontal: layout.screenX,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerBrandRow}>
            <BrandLogo height={58} width={46} />
            <View style={styles.headerCopy}>
              <Text style={styles.sectionNum}>PROFILE</Text>
              <Text style={styles.title}>Local profile.</Text>
            </View>
          </View>
          <Text style={styles.sub}>
            A lightweight on-device profile for private glow-maxing, Library browsing,
            rotations, and personal notes. No account required.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelKicker}>NAME / OPTIONAL</Text>
          <TextInput
            accessibilityLabel="Optional profile name"
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
                {isPro ? 'PRO' : 'FREE'}
              </Text>
            </View>
          </View>
          <Text style={styles.copy}>
            {isPro
              ? 'Pro is active: deep Glowmax guide, exports, saved items, AI-assisted organization, and private reminders.'
              : 'Free path: Library, Today\'s Rotation, local logs, and personal notes.'}
          </Text>
          {!paywallStatus.canPresent && !isPro ? (
            <Text style={styles.setupNote}>Purchases are unavailable in this build. Free features remain available.</Text>
          ) : null}
          {isPro ? (
            <Pressable
              accessibilityLabel="Manage subscription"
              accessibilityRole="button"
              onPress={showCustomerCenter}
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
              <Text style={styles.ghostBtnText}>Manage subscription -&gt;</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityLabel="Start Pro trial"
              accessibilityRole="button"
              onPress={() => { void showPaywallWithAlert(showPaywall); }}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
              <Text style={styles.primaryBtnText}>Start trial -&gt;</Text>
            </Pressable>
          )}
          {!isPro ? (
            <Text style={styles.trialCopy}>
              Trial and pricing are shown on the Apple purchase sheet. Cancel anytime in Apple subscriptions.
            </Text>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelKicker}>PRIVACY</Text>
          <Text style={styles.copy}>
            Your Library choices, rotations, logs, notes, and profile name are stored locally on this device. AI features disclose when data is sent for a request.
          </Text>
        </View>

        {__DEV__ ? (
          <View style={styles.panel}>
            <Text style={styles.panelKicker}>DEV ACCESS MODE</Text>
            <Text style={styles.copy}>
              Switch the local entitlement state to smoke test Free and Pro screens without changing RevenueCat.
            </Text>
            <View style={styles.devModeRow}>
              {DEV_MODES.map((mode) => (
                <Pressable
                  accessibilityLabel={`Set dev access mode to ${mode}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: devAccessMode === mode }}
                  key={mode}
                  onPress={() => setDevAccessMode(mode)}
                  style={[styles.devModeChip, devAccessMode === mode && styles.devModeChipOn]}>
                  <Text style={[styles.devModeText, devAccessMode === mode && styles.devModeTextOn]}>
                    {mode.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.revenueCatDebug}>
              <DebugRow label="Entitlement" value={paywallStatus.entitlementId} />
              <DebugRow label="Configured" value={paywallStatus.isConfigured ? 'Yes' : 'No'} />
              <DebugRow label="Can present" value={paywallStatus.canPresent ? 'Yes' : 'No'} />
              <DebugRow label="Outcome" value={paywallStatus.outcome} />
              <DebugRow label="Latest" value={paywallStatus.message} />
            </View>
          </View>
        ) : null}

        <View style={styles.panel}>
          <Text style={styles.panelKicker}>APP INFO</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaKey}>VERSION</Text>
              <Text style={styles.metaVal}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
            </View>
            <View style={[styles.metaCell, styles.metaCellBordered]}>
              <Text style={styles.metaKey}>STORAGE</Text>
              <Text style={styles.metaVal}>Local</Text>
            </View>
            <View style={[styles.metaCell, styles.metaCellBordered]}>
              <Text style={styles.metaKey}>AUTH</Text>
              <Text style={styles.metaVal}>None</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              accessibilityLabel="Restore purchases"
              accessibilityRole="button"
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
            {appStoreReviewUrl ? (
              <Pressable
                accessibilityLabel="Rate GlowPep in the App Store"
                accessibilityRole="button"
                onPress={() => {
                  void Linking.openURL(appStoreReviewUrl);
                }}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                <Text style={styles.secondaryBtnText}>Rate app</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityLabel="Delete local app data"
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(
                'Delete local data',
                'This clears all GlowPep data saved on this device, including guide answers, saved items, logs, reminders, recipes, favorites, and privacy acknowledgements.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      await clearAllLocalAppData();
                      setName('');
                      Alert.alert('Done', 'Local app data has been cleared. Restart the app to see the fresh-start flow.');
                    },
                  },
                ],
              )
            }
            style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}>
            <Text style={styles.deleteBtnText}>Delete local app data</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.debugRow}>
      <Text style={styles.debugLabel}>{label}</Text>
      <Text style={styles.debugValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 12,
    width: '100%',
  },
  header: {
    marginBottom: 20,
  },
  headerBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  headerCopy: {
    flex: 1,
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
  setupNote: {
    ...t.bodySmall,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.warning,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trialCopy: {
    ...t.bodySmall,
    color: colors.textDim,
    fontSize: 12,
    marginTop: 12,
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
    minHeight: 44,
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
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ghostBtnText: {
    ...t.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  devModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  devModeChip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
  },
  devModeChipOn: {
    backgroundColor: `${colors.accent}18`,
    borderColor: colors.accent,
  },
  devModeText: {
    ...t.dataSmall,
    color: colors.textMuted,
  },
  devModeTextOn: {
    color: colors.accent,
  },
  revenueCatDebug: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginTop: 14,
    padding: 12,
  },
  debugRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  debugLabel: {
    ...t.dataSmall,
    color: colors.textDim,
    flexShrink: 0,
  },
  debugValue: {
    ...t.dataSmall,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
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
    minHeight: 44,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    ...t.bodySmall,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  deleteBtn: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    minHeight: 44,
    paddingVertical: 12,
  },
  deleteBtnText: {
    ...t.bodySmall,
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
