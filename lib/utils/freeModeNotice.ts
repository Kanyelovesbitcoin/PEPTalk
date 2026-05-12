import { STORAGE_KEYS } from '@/lib/constants/storage';
import { storage } from '@/lib/utils/storage';

const DEFAULT_FREE_MODE_NOTICE =
  'Trial was not started. Free mode is ready: Library, Today\'s Rotation, local logs, and personal notes.';

export async function setFreeModeNotice(message = DEFAULT_FREE_MODE_NOTICE) {
  await storage.setItem(STORAGE_KEYS.freeModeNotice, message);
}

export async function consumeFreeModeNotice() {
  const message = await storage.getItem(STORAGE_KEYS.freeModeNotice);
  if (message) {
    await storage.removeItem(STORAGE_KEYS.freeModeNotice);
  }
  return message;
}
