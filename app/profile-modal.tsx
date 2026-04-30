import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { usePro } from '@/lib/hooks/usePro';
import { storage } from '@/lib/utils/storage';

export default function ProfileModal() {
  const { isPro, restorePurchases, showPaywall, showCustomerCenter } = usePro();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Handle bar */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable
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
          {isPro ? (
            <Pressable
              onPress={showCustomerCenter}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Ionicons color={colors.text} name="card-outline" size={18} />
              <Text style={styles.actionButtonText}>Manage Subscription</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={showPaywall}
              style={({ pressed }) => [styles.upgradeButton, pressed && styles.pressed]}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </Pressable>
          )}
        </View>

        {/* App Actions */}
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>App</Text>

          <Pressable
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

          <Pressable
            onPress={() =>
              Alert.alert(
                'Rate GlowPep',
                'Add your App Store review URL when the listing is live.',
              )
            }
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="star-outline" size={18} />
            <Text style={styles.actionButtonText}>Rate App</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Alert.alert(
                'Reset App',
                'This will clear all saved data including quiz results and favorites. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      await Promise.all(
                        [
                          STORAGE_KEYS.quizDraft,
                          STORAGE_KEYS.savedStacks,
                          STORAGE_KEYS.favoriteIds,
                          STORAGE_KEYS.profileName,
                          STORAGE_KEYS.doseLogs,
                          STORAGE_KEYS.doseSchedules,
                          STORAGE_KEYS.vialRecipes,
                          STORAGE_KEYS.dailyCheckIns,
                          STORAGE_KEYS.freeAiStackUsed,
                          STORAGE_KEYS.aiPrivacyAccepted,
                        ].map((key) => storage.removeItem(key)),
                      );
                      Alert.alert('Done', 'App data has been cleared. Restart the app to see changes.');
                    },
                  },
                ],
              )
            }
            style={({ pressed }) => [styles.actionButton, styles.dangerAction, pressed && styles.pressed]}>
            <Ionicons color={colors.danger} name="trash-outline" size={18} />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Reset App Data</Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
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
    height: 36,
    justifyContent: 'center',
    width: 36,
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
  badge: {
    backgroundColor: 'rgba(103, 232, 249, 0.16)',
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
    backgroundColor: 'rgba(74, 222, 128, 0.16)',
  },
  badgeTextPro: {
    color: colors.success,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
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
