import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  hasOnboarded: 'glowpep/has-onboarded',
  favoriteIds: 'glowpep/favorite-ids',
  quizDraft: 'glowpep/quiz-draft',
  savedStacks: 'glowpep/saved-stacks',
  profileName: 'glowpep/profile-name',
  doseLogs: 'glowpep/dose-logs',
  doseSchedules: 'glowpep/dose-schedules',
  vialRecipes: 'glowpep/vial-recipes',
  dailyCheckIns: 'glowpep/daily-check-ins',
  logbookNote: 'glowpep/logbook-note',
  scheduleNotificationIds: 'glowpep/schedule-notification-ids',
  freeAiStackUsed: 'glowpep/free-ai-stack-used',
  aiPrivacyAccepted: 'glowpep/ai-privacy-accepted',
  symptomLogs: 'glowpep/symptom-logs:v1',
  skinScans: 'glowpep/skin-scans',
  cosmeticDisclaimer: 'glowpep/cosmetic-disclaimer',
  legacyMigrated: 'glowpep/legacy-migrated:v1',
} as const;

const LEGACY_KEY_MAP: Record<string, string> = {
  'pep-talk/has-onboarded': STORAGE_KEYS.hasOnboarded,
  'pep-talk/favorite-ids': STORAGE_KEYS.favoriteIds,
  'pep-talk/quiz-draft': STORAGE_KEYS.quizDraft,
  'pep-talk/saved-stacks': STORAGE_KEYS.savedStacks,
  'pep-talk/profile-name': STORAGE_KEYS.profileName,
  'pep-talk/dose-logs': STORAGE_KEYS.doseLogs,
  'pep-talk/dose-schedules': STORAGE_KEYS.doseSchedules,
  'pep-talk/vial-recipes': STORAGE_KEYS.vialRecipes,
  'pep-talk/daily-check-ins': STORAGE_KEYS.dailyCheckIns,
  'pep-talk/logbook-note': STORAGE_KEYS.logbookNote,
  'pep-talk/schedule-notification-ids': STORAGE_KEYS.scheduleNotificationIds,
  'pep-talk/free-ai-stack-used': STORAGE_KEYS.freeAiStackUsed,
  'pep-talk/ai-privacy-accepted': STORAGE_KEYS.aiPrivacyAccepted,
  'pep-talk/symptom-logs:v1': STORAGE_KEYS.symptomLogs,
};

export async function migrateLegacyKeys(): Promise<void> {
  try {
    const alreadyMigrated = await AsyncStorage.getItem(STORAGE_KEYS.legacyMigrated);
    if (alreadyMigrated) return;
    const entries = await AsyncStorage.multiGet(Object.keys(LEGACY_KEY_MAP));
    const writes: [string, string][] = [];
    const removes: string[] = [];
    for (const [legacyKey, value] of entries) {
      if (value == null) continue;
      const newKey = LEGACY_KEY_MAP[legacyKey];
      if (!newKey) continue;
      const existing = await AsyncStorage.getItem(newKey);
      if (existing == null) writes.push([newKey, value]);
      removes.push(legacyKey);
    }
    if (writes.length) await AsyncStorage.multiSet(writes);
    if (removes.length) await AsyncStorage.multiRemove(removes);
    await AsyncStorage.setItem(STORAGE_KEYS.legacyMigrated, '1');
  } catch {
    // best-effort — never block app startup on migration
  }
}
