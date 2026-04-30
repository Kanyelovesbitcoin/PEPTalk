import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { getUpcomingScheduledDoses } from '@/lib/utils/trackerDates';
import { storage } from '@/lib/utils/storage';
import type { DoseSchedule } from '@/types/tracker';

type ScheduleNotificationMap = Record<string, string[]>;

const CHANNEL_ID = 'protocol-reminders';
const PRE_SCHEDULE_COUNT = 30;
const isExpoGo = Constants.appOwnership === 'expo';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;

async function getNotifications() {
  if (isExpoGo) {
    return null;
  }

  if (!notificationsModule) {
    const moduleName = 'expo-notifications';
    notificationsModule = (await import(moduleName)) as NotificationsModule;
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  return notificationsModule;
}

function parseMap(value: string | null): ScheduleNotificationMap {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? (parsed as ScheduleNotificationMap) : {};
  } catch {
    return {};
  }
}

async function getNotificationMap() {
  return parseMap(await storage.getItem(STORAGE_KEYS.scheduleNotificationIds));
}

async function saveNotificationMap(map: ScheduleNotificationMap) {
  await storage.setItem(STORAGE_KEYS.scheduleNotificationIds, JSON.stringify(map));
}

export async function ensureNotificationSetup() {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#00FF88',
      name: 'Protocol reminders',
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function requestNotificationPermissions() {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return false;
  }

  await ensureNotificationSetup();

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function cancelScheduleReminders(scheduleId: string) {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return;
  }

  const map = await getNotificationMap();
  const ids = map[scheduleId] ?? [];

  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  delete map[scheduleId];
  await saveNotificationMap(map);
}

export async function scheduleDoseReminders(schedule: DoseSchedule) {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return false;
  }

  if (!schedule.active || !schedule.remindersEnabled) {
    await cancelScheduleReminders(schedule.id);
    return false;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) {
    return false;
  }

  await cancelScheduleReminders(schedule.id);

  const upcoming = getUpcomingScheduledDoses(schedule, PRE_SCHEDULE_COUNT);
  const ids = await Promise.all(
    upcoming.map((preview) =>
      Notifications.scheduleNotificationAsync({
        content: {
          body: 'Time to review your scheduled protocol.',
          data: { scheduleId: schedule.id, scheduledAt: preview.scheduledAt },
          sound: 'default',
          title: 'GlowPep reminder',
        },
        trigger: {
          channelId: CHANNEL_ID,
          date: new Date(preview.scheduledAt),
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
      }),
    ),
  );

  const map = await getNotificationMap();
  map[schedule.id] = ids;
  await saveNotificationMap(map);
  return true;
}

export async function reconcileDoseReminders(schedules: DoseSchedule[]) {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return;
  }

  const activeIds = new Set(schedules.map((schedule) => schedule.id));
  const map = await getNotificationMap();
  const staleIds = Object.keys(map).filter((scheduleId) => !activeIds.has(scheduleId));

  await Promise.all(staleIds.map((scheduleId) => cancelScheduleReminders(scheduleId)));
  await Promise.all(
    schedules.map((schedule) =>
      schedule.active && schedule.remindersEnabled
        ? scheduleDoseReminders(schedule)
        : cancelScheduleReminders(schedule.id),
    ),
  );
}
