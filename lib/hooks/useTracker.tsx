import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { STORAGE_KEYS } from '@/lib/constants/storage';
import { usePro } from '@/lib/hooks/usePro';
import {
  cancelScheduleReminders,
  reconcileDoseReminders,
  scheduleDoseReminders,
} from '@/lib/services/notifications';
import { getNextScheduledDose, getScheduledDoseForDate, isToday } from '@/lib/utils/trackerDates';
import { storage } from '@/lib/utils/storage';
import { parseJsonArray, setJsonItem } from '@/lib/utils/storageJson';
import type { DailyCheckIn, DoseLog, DoseSchedule, DoseStatus, ScheduledDosePreview, VialRecipe } from '@/types/tracker';

type NewDoseLog = Omit<DoseLog, 'id' | 'createdAt' | 'updatedAt'>;
type NewVialRecipe = Omit<VialRecipe, 'id' | 'createdAt' | 'updatedAt'>;
type NewDoseSchedule = Omit<DoseSchedule, 'id' | 'createdAt' | 'updatedAt'>;
type NewDailyCheckIn = Omit<DailyCheckIn, 'id' | 'createdAt' | 'updatedAt'>;
type ScheduleUpdates = Partial<Omit<DoseSchedule, 'id' | 'createdAt' | 'updatedAt'>>;

interface TrackerContextValue {
  isReady: boolean;
  doseLogs: DoseLog[];
  vialRecipes: VialRecipe[];
  schedules: DoseSchedule[];
  checkIns: DailyCheckIn[];
  todayLogs: DoseLog[];
  todayCheckIn: DailyCheckIn | null;
  nextDose: ScheduledDosePreview | null;
  addDoseLog: (dose: NewDoseLog) => DoseLog;
  updateDoseLog: (doseId: string, updates: Partial<DoseLog>) => void;
  addVialRecipe: (recipe: NewVialRecipe) => VialRecipe;
  addSchedule: (schedule: NewDoseSchedule) => DoseSchedule;
  updateSchedule: (scheduleId: string, updates: ScheduleUpdates) => void;
  saveCheckIn: (checkIn: NewDailyCheckIn) => DailyCheckIn;
  logScheduledDose: (scheduleId: string) => DoseLog | null;
  logScheduledDoseStatus: (scheduleId: string, status: Extract<DoseStatus, 'taken' | 'skipped'>) => DoseLog | null;
  unlogScheduledDose: (scheduleId: string) => void;
  clearScheduledDoseForToday: (scheduleId: string) => void;
  toggleScheduledDoseForToday: (scheduleId: string) => void;
  toggleSchedule: (scheduleId: string) => void;
  deleteSchedule: (scheduleId: string) => void;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const PERSIST_DEBOUNCE_MS = 750;

function useDebouncedJsonPersistence(key: string, value: unknown, isReady: boolean) {
  useEffect(() => {
    if (!isReady) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setJsonItem(key, value);
    }, PERSIST_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [isReady, key, value]);
}

function withoutReminders(schedule: DoseSchedule): DoseSchedule {
  return schedule.remindersEnabled ? { ...schedule, remindersEnabled: false } : schedule;
}

export function TrackerProvider({ children }: { children: ReactNode }) {
  const { isPro } = usePro();
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [vialRecipes, setVialRecipes] = useState<VialRecipe[]>([]);
  const [schedules, setSchedules] = useState<DoseSchedule[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadTrackerState() {
      try {
        const [storedLogs, storedRecipes, storedSchedules, storedCheckIns] = await Promise.all([
          storage.getItem(STORAGE_KEYS.doseLogs),
          storage.getItem(STORAGE_KEYS.vialRecipes),
          storage.getItem(STORAGE_KEYS.doseSchedules),
          storage.getItem(STORAGE_KEYS.dailyCheckIns),
        ]);

        setDoseLogs(parseJsonArray<DoseLog>(storedLogs, STORAGE_KEYS.doseLogs));
        setVialRecipes(parseJsonArray<VialRecipe>(storedRecipes, STORAGE_KEYS.vialRecipes));
        const parsedSchedules = parseJsonArray<DoseSchedule>(storedSchedules, STORAGE_KEYS.doseSchedules);
        setSchedules(isPro ? parsedSchedules : parsedSchedules.map(withoutReminders));
        setCheckIns(parseJsonArray<DailyCheckIn>(storedCheckIns, STORAGE_KEYS.dailyCheckIns));
        reconcileDoseReminders(isPro ? parsedSchedules : parsedSchedules.map(withoutReminders)).catch(() => undefined);
      } finally {
        setIsReady(true);
      }
    }

    loadTrackerState();
  }, [isPro]);

  useEffect(() => {
    if (!isReady || isPro) {
      return;
    }

    const schedulesWithReminders = schedules.filter((schedule) => schedule.remindersEnabled);
    if (schedulesWithReminders.length === 0) {
      return;
    }

    schedulesWithReminders.forEach((schedule) => {
      cancelScheduleReminders(schedule.id).catch(() => undefined);
    });
    setSchedules((current) => current.map(withoutReminders));
  }, [isPro, isReady, schedules]);

  useDebouncedJsonPersistence(STORAGE_KEYS.doseLogs, doseLogs, isReady);
  useDebouncedJsonPersistence(STORAGE_KEYS.vialRecipes, vialRecipes, isReady);
  useDebouncedJsonPersistence(STORAGE_KEYS.doseSchedules, schedules, isReady);
  useDebouncedJsonPersistence(STORAGE_KEYS.dailyCheckIns, checkIns, isReady);

  const sortedLogs = useMemo(
    () => [...doseLogs].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    [doseLogs],
  );

  const todayLogs = useMemo(
    () => sortedLogs.filter((log) => isToday(log.scheduledAt)),
    [sortedLogs],
  );

  const sortedCheckIns = useMemo(
    () => [...checkIns].sort((a, b) => b.date.localeCompare(a.date)),
    [checkIns],
  );

  const todayCheckIn = useMemo(
    () => sortedCheckIns.find((checkIn) => checkIn.date === new Date().toISOString().slice(0, 10)) ?? null,
    [sortedCheckIns],
  );

  const nextDose = useMemo(() => {
    return schedules
      .map((schedule) => getNextScheduledDose(schedule))
      .filter(Boolean)
      .sort((a, b) => a!.scheduledAt.localeCompare(b!.scheduledAt))[0] ?? null;
  }, [schedules]);

  const value: TrackerContextValue = useMemo(() => ({
    isReady,
    doseLogs: sortedLogs,
    vialRecipes,
    schedules,
    checkIns: sortedCheckIns,
    todayLogs,
    todayCheckIn,
    nextDose,
    addDoseLog: (dose) => {
      const now = new Date().toISOString();
      const newDose: DoseLog = {
        ...dose,
        id: createId('dose'),
        createdAt: now,
        updatedAt: now,
      };
      setDoseLogs((current) => [newDose, ...current]);
      return newDose;
    },
    updateDoseLog: (doseId, updates) => {
      setDoseLogs((current) =>
        current.map((dose) =>
          dose.id === doseId ? { ...dose, ...updates, updatedAt: new Date().toISOString() } : dose,
        ),
      );
    },
    addVialRecipe: (recipe) => {
      const now = new Date().toISOString();
      const newRecipe: VialRecipe = {
        ...recipe,
        id: createId('vial'),
        createdAt: now,
        updatedAt: now,
      };
      setVialRecipes((current) => [newRecipe, ...current]);
      return newRecipe;
    },
    addSchedule: (schedule) => {
      const now = new Date().toISOString();
      const newSchedule: DoseSchedule = {
        ...schedule,
        id: createId('schedule'),
        createdAt: now,
        remindersEnabled: isPro && schedule.remindersEnabled,
        updatedAt: now,
      };
      setSchedules((current) => [newSchedule, ...current]);
      if (isPro && newSchedule.remindersEnabled) {
        scheduleDoseReminders(newSchedule).catch(() => undefined);
      }
      return newSchedule;
    },
    updateSchedule: (scheduleId, updates) => {
      const existing = schedules.find((item) => item.id === scheduleId);
      const normalizedUpdates = isPro ? updates : { ...updates, remindersEnabled: false };
      const updatedSchedule = existing
        ? { ...existing, ...normalizedUpdates, updatedAt: new Date().toISOString() }
        : null;

      if (existing?.remindersEnabled) {
        cancelScheduleReminders(scheduleId).catch(() => undefined);
      }
      if (isPro && updatedSchedule?.active && updatedSchedule.remindersEnabled) {
        scheduleDoseReminders(updatedSchedule).catch(() => undefined);
      }

      setSchedules((current) =>
        current.map((schedule) => (schedule.id === scheduleId ? { ...schedule, ...normalizedUpdates, updatedAt: new Date().toISOString() } : schedule)),
      );
    },
    saveCheckIn: (checkIn) => {
      const now = new Date().toISOString();
      const existing = checkIns.find((item) => item.date === checkIn.date);

      if (existing) {
        const updated: DailyCheckIn = { ...existing, ...checkIn, updatedAt: now };
        setCheckIns((current) => current.map((item) => (item.id === existing.id ? updated : item)));
        return updated;
      }

      const newCheckIn: DailyCheckIn = {
        ...checkIn,
        id: createId('checkin'),
        createdAt: now,
        updatedAt: now,
      };
      setCheckIns((current) => [newCheckIn, ...current]);
      return newCheckIn;
    },
    logScheduledDose: (scheduleId) => {
      const schedule = schedules.find((item) => item.id === scheduleId);
      if (!schedule || !schedule.active || schedule.amount <= 0) {
        return null;
      }

      const existing = doseLogs.find(
        (log) => log.scheduleId === scheduleId && log.status === 'taken' && isToday(log.scheduledAt),
      );
      if (existing) {
        return existing;
      }

      const preview = getScheduledDoseForDate(schedule);
      if (!preview) {
        return null;
      }

      const now = new Date().toISOString();
      const newDose: DoseLog = {
        administrationRoute: schedule.administrationRoute,
        amount: schedule.amount,
        compoundId: schedule.compoundId,
        createdAt: now,
        id: createId('dose'),
        injectionSite: schedule.injectionSite,
        scheduleId,
        scheduledAt: preview.scheduledAt,
        status: 'taken',
        takenAt: now,
        unit: schedule.unit,
        updatedAt: now,
        vialRecipeId: schedule.vialRecipeId,
      };

      setDoseLogs((current) => {
        const alreadyLogged = current.some(
          (log) => log.scheduleId === scheduleId && log.status === 'taken' && isToday(log.scheduledAt),
        );
        return alreadyLogged ? current : [newDose, ...current];
      });
      return newDose;
    },
    logScheduledDoseStatus: (scheduleId, status) => {
      const schedule = schedules.find((item) => item.id === scheduleId);
      if (!schedule || !schedule.active || schedule.amount <= 0) {
        return null;
      }

      const preview = getScheduledDoseForDate(schedule);
      if (!preview) {
        return null;
      }

      const now = new Date().toISOString();
      const newDose: DoseLog = {
        administrationRoute: schedule.administrationRoute,
        amount: schedule.amount,
        compoundId: schedule.compoundId,
        createdAt: now,
        id: createId('dose'),
        injectionSite: schedule.injectionSite,
        scheduleId,
        scheduledAt: preview.scheduledAt,
        status,
        takenAt: status === 'taken' ? now : undefined,
        unit: schedule.unit,
        updatedAt: now,
        vialRecipeId: schedule.vialRecipeId,
      };

      setDoseLogs((current) => [
        newDose,
        ...current.filter((log) => !(log.scheduleId === scheduleId && isToday(log.scheduledAt))),
      ]);
      return newDose;
    },
    unlogScheduledDose: (scheduleId) => {
      setDoseLogs((current) =>
        current.filter((log) => !(log.scheduleId === scheduleId && isToday(log.scheduledAt))),
      );
    },
    clearScheduledDoseForToday: (scheduleId) => {
      setDoseLogs((current) =>
        current.filter((log) => !(log.scheduleId === scheduleId && isToday(log.scheduledAt))),
      );
    },
    toggleScheduledDoseForToday: (scheduleId) => {
      const existing = doseLogs.find(
        (log) => log.scheduleId === scheduleId && log.status === 'taken' && isToday(log.scheduledAt),
      );
      if (existing) {
        setDoseLogs((current) =>
          current.filter((log) => !(log.scheduleId === scheduleId && log.status === 'taken' && isToday(log.scheduledAt))),
        );
        return;
      }

      const schedule = schedules.find((item) => item.id === scheduleId);
      if (!schedule || !schedule.active || schedule.amount <= 0) {
        return;
      }

      const preview = getScheduledDoseForDate(schedule);
      if (!preview) {
        return;
      }

      const now = new Date().toISOString();
      const newDose: DoseLog = {
        administrationRoute: schedule.administrationRoute,
        amount: schedule.amount,
        compoundId: schedule.compoundId,
        createdAt: now,
        id: createId('dose'),
        injectionSite: schedule.injectionSite,
        scheduleId,
        scheduledAt: preview.scheduledAt,
        status: 'taken',
        takenAt: now,
        unit: schedule.unit,
        updatedAt: now,
        vialRecipeId: schedule.vialRecipeId,
      };
      setDoseLogs((current) => [
        newDose,
        ...current.filter((log) => !(log.scheduleId === scheduleId && isToday(log.scheduledAt))),
      ]);
    },
    toggleSchedule: (scheduleId) => {
      const schedule = schedules.find((item) => item.id === scheduleId);
      if (schedule) {
        if (schedule.active) {
          cancelScheduleReminders(scheduleId).catch(() => undefined);
        } else if (isPro && schedule.remindersEnabled) {
          scheduleDoseReminders({ ...schedule, active: true }).catch(() => undefined);
        }
      }

      setSchedules((current) =>
        current.map((schedule) =>
          schedule.id === scheduleId
            ? { ...schedule, active: !schedule.active, updatedAt: new Date().toISOString() }
            : schedule,
        ),
      );
    },
    deleteSchedule: (scheduleId) => {
      cancelScheduleReminders(scheduleId).catch(() => undefined);
      setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId));
    },
  }), [
    checkIns,
    doseLogs,
    isReady,
    isPro,
    nextDose,
    schedules,
    sortedCheckIns,
    sortedLogs,
    todayCheckIn,
    todayLogs,
    vialRecipes,
  ]);

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker() {
  const context = useContext(TrackerContext);

  if (!context) {
    throw new Error('useTracker must be used inside TrackerProvider');
  }

  return context;
}
