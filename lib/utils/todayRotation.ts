import { compoundById } from '@/lib/data/compounds';
import { formatDoseAmount } from '@/lib/utils/reconstitution';
import { getNextScheduledDose, getScheduledDoseForDate, isToday } from '@/lib/utils/trackerDates';
import type { DoseLog, DoseSchedule, ScheduledDosePreview } from '@/types/tracker';

export type TodayRotationStatus = 'pending' | 'setup' | 'taken' | 'skipped' | 'upcoming';

export interface TodayRotationItem {
  amountLabel: string;
  canLog: boolean;
  compoundId: string;
  compoundName: string;
  injectionSite?: string;
  logId?: string;
  routeLabel: string;
  schedule: DoseSchedule;
  scheduledAt: string;
  status: TodayRotationStatus;
  timeLabel: string;
}

export type TodayRotationLaneKey = 'morning' | 'night';

export interface TodayRotationLane {
  completedCount: number;
  completedItems: TodayRotationItem[];
  featuredItem: TodayRotationItem | null;
  key: TodayRotationLaneKey;
  label: string;
  queuedItems: TodayRotationItem[];
  totalCount: number;
}

export interface TodayRotationQueue {
  completedCount: number;
  completedItems: TodayRotationItem[];
  dueItems: TodayRotationItem[];
  morning: TodayRotationLane;
  nextItem: TodayRotationItem | null;
  nextUpcoming: TodayRotationItem | null;
  night: TodayRotationLane;
  pendingItems: TodayRotationItem[];
  skippedCount: number;
  takenCount: number;
  totalCount: number;
}

const ROUTE_LABELS: Record<string, string> = {
  injection: 'Non-oral',
  nasal: 'Nasal',
  oral: 'Oral',
  sublingual: 'Sublingual',
  topical: 'Topical',
};

function startOfTomorrow(fromDate: Date) {
  return new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + 1);
}

function formatRoute(route?: string) {
  return route ? ROUTE_LABELS[route] ?? route : 'Route not set';
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function latestLogForSchedule(scheduleId: string, todayLogs: DoseLog[]) {
  return todayLogs
    .filter((log) => log.scheduleId === scheduleId && isToday(log.scheduledAt))
    .sort((a, b) => {
      const aTime = a.updatedAt ?? a.takenAt ?? a.createdAt;
      const bTime = b.updatedAt ?? b.takenAt ?? b.createdAt;
      return bTime.localeCompare(aTime);
    })[0] ?? null;
}

function itemFromPreview(
  preview: ScheduledDosePreview,
  status: TodayRotationStatus,
  log?: DoseLog | null,
): TodayRotationItem {
  const { schedule, scheduledAt } = preview;
  const compound = compoundById[schedule.compoundId];
  const route = String(schedule.administrationRoute ?? compound?.administrationRoutes[0] ?? '');

  return {
    amountLabel: formatDoseAmount(schedule.amount, schedule.unit),
    canLog: schedule.amount > 0,
    compoundId: schedule.compoundId,
    compoundName: compound?.name ?? 'Peptide',
    injectionSite: schedule.injectionSite,
    logId: log?.id,
    routeLabel: formatRoute(route),
    schedule,
    scheduledAt,
    status,
    timeLabel: schedule.timeLabel ?? formatTime(scheduledAt),
  };
}

function upcomingRotationItem(schedules: DoseSchedule[], fromDate: Date) {
  const upcoming = schedules
    .map((schedule) => getNextScheduledDose(schedule, fromDate))
    .filter(Boolean)
    .sort((a, b) => a!.scheduledAt.localeCompare(b!.scheduledAt))[0];

  return upcoming ? itemFromPreview(upcoming, 'upcoming') : null;
}

function laneKeyForItem(item: TodayRotationItem): TodayRotationLaneKey {
  return new Date(item.scheduledAt).getHours() < 15 ? 'morning' : 'night';
}

function buildLane(key: TodayRotationLaneKey, items: TodayRotationItem[]): TodayRotationLane {
  const laneItems = items.filter((item) => laneKeyForItem(item) === key);
  const pending = laneItems.filter((item) => item.status === 'pending' || item.status === 'setup');
  const completedItems = laneItems.filter((item) => item.status === 'taken' || item.status === 'skipped');
  const featuredItem = pending[0] ?? null;

  return {
    completedCount: completedItems.length,
    completedItems,
    featuredItem,
    key,
    label: key === 'morning' ? 'Morning Rotation' : 'Night Rotation',
    queuedItems: featuredItem ? pending.slice(1) : [],
    totalCount: laneItems.length,
  };
}

export function buildTodayRotationQueue(
  schedules: DoseSchedule[],
  todayLogs: DoseLog[],
  fromDate = new Date(),
): TodayRotationQueue {
  const dueItems = schedules
    .map((schedule) => getScheduledDoseForDate(schedule, fromDate))
    .filter(Boolean)
    .map((preview) => {
      const log = latestLogForSchedule(preview!.schedule.id, todayLogs);
      const status = log?.status === 'taken' || log?.status === 'skipped'
        ? log.status
        : preview!.schedule.amount > 0
          ? 'pending'
          : 'setup';
      return itemFromPreview(preview!, status, log);
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const pendingItems = dueItems.filter((item) => item.status === 'pending' || item.status === 'setup');
  const completedItems = dueItems.filter((item) => item.status === 'taken' || item.status === 'skipped');
  const takenCount = dueItems.filter((item) => item.status === 'taken').length;
  const skippedCount = dueItems.filter((item) => item.status === 'skipped').length;
  const upcomingFrom = dueItems.length > 0 && pendingItems.length === 0 ? startOfTomorrow(fromDate) : fromDate;
  const morning = buildLane('morning', dueItems);
  const night = buildLane('night', dueItems);

  return {
    completedCount: completedItems.length,
    completedItems,
    dueItems,
    morning,
    nextItem: pendingItems[0] ?? null,
    nextUpcoming: upcomingRotationItem(schedules, upcomingFrom),
    night,
    pendingItems,
    skippedCount,
    takenCount,
    totalCount: dueItems.length,
  };
}
