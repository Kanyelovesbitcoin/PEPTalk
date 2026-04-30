import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// On iOS we use NSUbiquitousKeyValueStore via react-native-icloudstore.
// It auto-syncs across the user's iOS devices using their existing iCloud
// account (no auth required) and falls back to AsyncStorage on Android/web.
// Total store cap is ~1MB, ~1024 keys, ~1MB per value — plenty for quiz
// answers, saved stacks, and favorites.
let iCloudStorage: typeof AsyncStorage | null = null;

if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    iCloudStorage = require('react-native-icloudstore').default;
  } catch {
    iCloudStorage = null;
  }
}

const backend = iCloudStorage ?? AsyncStorage;

export const storage = {
  getItem: (key: string) => backend.getItem(key),
  setItem: (key: string, value: string) => backend.setItem(key, value),
  removeItem: (key: string) => backend.removeItem(key),
};
