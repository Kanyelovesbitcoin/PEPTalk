import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { useAdaptiveLayout } from '@/lib/hooks/useAdaptiveLayout';
import { usePro } from '@/lib/hooks/usePro';
import { showPaywallWithAlert } from '@/lib/utils/paywallAlerts';
import { clearAllLocalAppData } from '@/lib/utils/resetAppData';

export default function ProfileModal() {
  const layout = useAdaptiveLayout();
  const { isPro, paywallStatus, restorePurchases, showPaywall, showCustomerCenter } = usePro();
  const appStoreReviewUrl = Constants.expoConfig?.extra?.appStoreReviewUrl as string | undefined;

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
        {/* Handle bar */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable
            accessibilityLabel="Close settings"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={22} />
          </Pressable>
        </View>

        {/* Pro Status */}
        <View style={styles.panel}>
          <View style={styles.statusRow}>
            <Text style={styles.panelLabel}>Subscription</Text>
            <View style={[styles.badge, isPro && styles.badgePro]}>
              <Text style={[styles.badgeText, isPro && styles.badgeTextPro]}>
                {isPro ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
          <Text style={styles.statusCopy}>
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
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Ionicons color={colors.text} name="card-outline" size={18} />
              <Text style={styles.actionButtonText}>Manage Subscription</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityLabel="Start Pro trial"
              accessibilityRole="button"
              onPress={() => { void showPaywallWithAlert(showPaywall); }}
              style={({ pressed }) => [styles.upgradeButton, pressed && styles.pressed]}>
              <Text style={styles.upgradeButtonText}>Start trial</Text>
            </Pressable>
          )}
          {!isPro ? (
            <Text style={styles.trialCopy}>
              Trial and pricing are shown on the Apple purchase sheet. Cancel anytime in Apple subscriptions.
            </Text>
          ) : null}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Privacy</Text>
          <Text style={styles.statusCopy}>
            Logs, notes, rotations, and Library choices stay local on this device. AI features disclose when data is sent for a request.
          </Text>
        </View>

        {/* App Actions */}
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>App</Text>

          <Pressable
            accessibilityLabel="Restore purchases"
            accessibilityRole="button"
            onPress={async () => {
              const restored = await restorePurchases();
              Alert.alert(
                restored ? 'Restored' : 'Nothing to Restore',
                restored
                  ? 'Your Pro access has been restored.'
                  : 'No previous purchases were found for this account.',
              );
            }}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="refresh-outline" size={18} />
            <Text style={styles.actionButtonText}>Restore Purchases</Text>
          </Pressable>

          {appStoreReviewUrl ? (
            <Pressable
              accessibilityLabel="Rate GlowPep in the App Store"
              accessibilityRole="button"
              onPress={() => {
                void Linking.openURL(appStoreReviewUrl);
              }}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Ionicons color={colors.text} name="star-outline" size={18} />
              <Text style={styles.actionButtonText}>Rate App</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityLabel="Delete local app data"
            accessibilityRole="button"
            onPress={() =>
              Alert.alert(
                'Reset App',
                'This will clear all local GlowPep data, including guide answers, saved items, logs, reminders, recipes, favorites, and privacy acknowledgements. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      await clearAllLocalAppData();
                      Alert.alert('Done', 'Local app data has been cleared. Restart the app to see changes.');
                    },
                  },
                ],
              )
            }
            style={({ pressed }) => [styles.actionButton, styles.dangerAction, pressed && styles.pressed]}>
            <Ionicons color={colors.danger} name="trash-outline" size={18} />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Local App Data</Text>
          </Pressable>
        </View>

        {/* Version */}
        <Text style={styles.version}>
          GlowPep v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
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
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    width: '100%',
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  handle: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 5,
    width: 36,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  panelIcon: {
    marginBottom: 12,
  },
  panelLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  disclaimerTitle: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  disclaimerCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusCopy: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  setupNote: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trialCopy: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  badge: {
    backgroundColor: 'rgba(212, 168, 75, 0.10)',
    borderColor: 'rgba(212, 168, 75, 0.28)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  badgePro: {
    backgroundColor: colors.jadeGlow,
    borderColor: colors.jadeDeep,
  },
  badgeTextPro: {
    color: colors.success,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dangerAction: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerText: {
    color: colors.danger,
  },
  version: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
});
