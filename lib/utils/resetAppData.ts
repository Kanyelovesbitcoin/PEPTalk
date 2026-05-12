import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';

const LEGACY_LOCAL_KEYS = ['glowpep/skin-scans'];

export async function clearAllLocalAppData() {
  await Promise.all([...Object.values(STORAGE_KEYS), ...LEGACY_LOCAL_KEYS].map((key) => storage.removeItem(key)));
}
