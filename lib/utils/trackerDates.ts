import type { DoseSchedule, ScheduledDosePreview } from '@/types/tracker';

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseLocalDate(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function withTime(date: Date, timeOfDay: string) {
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const next = new Date(date);
  next.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return next;
}

function daysBetween(a: Date, b: Date) {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((end - start) / 86400000);
}

function matchesSchedule(schedule: DoseSchedule, date: Date) {
  const start = parseLocalDate(schedule.startDate);
  if (dateKey(date) < dateKey(start)) {
    return false;
  }

  if (schedule.endDate && dateKey(date) > schedule.endDate) {
    return false;
  }

  if (schedule.frequency === 'daily') {
    return true;
  }

  if (schedule.frequency === 'eod') {
    return daysBetween(start, date) % 2 === 0;
  }

  return Boolean(schedule.customDays?.includes(date.getDay()));
}

export function getNextScheduledDose(schedule: DoseSchedule, fromDate = new Date()): ScheduledDosePreview | null {
  if (!schedule.active) {
    return null;
  }

  for (let offset = 0; offset < 45; offset += 1) {
    const candidateDate = new Date(fromDate);
    candidateDate.setDate(fromDate.getDate() + offset);

    if (!matchesSchedule(schedule, candidateDate)) {
      continue;
    }

    const scheduledAt = withTime(candidateDate, schedule.timeOfDay);
    if (scheduledAt >= fromDate || offset > 0) {
      return { schedule, scheduledAt: scheduledAt.toISOString() };
    }
  }

  return null;
}

export function getScheduledDoseForDate(schedule: DoseSchedule, date = new Date()): ScheduledDosePreview | null {
  if (!schedule.active || !matchesSchedule(schedule, date)) {
    return null;
  }

  return { schedule, scheduledAt: withTime(date, schedule.timeOfDay).toISOString() };
}

export function getUpcomingScheduledDoses(
  schedule: DoseSchedule,
  count = 30,
  fromDate = new Date(),
): ScheduledDosePreview[] {
  if (!schedule.active) {
    return [];
  }

  const previews: ScheduledDosePreview[] = [];

  for (let offset = 0; offset < 180 && previews.length < count; offset += 1) {
    const candidateDate = new Date(fromDate);
    candidateDate.setDate(fromDate.getDate() + offset);

    if (!matchesSchedule(schedule, candidateDate)) {
      continue;
    }

    const scheduledAt = withTime(candidateDate, schedule.timeOfDay);
    if (scheduledAt >= fromDate || offset > 0) {
      previews.push({ schedule, scheduledAt: scheduledAt.toISOString() });
    }
  }

  return previews;
}

export function getTodayKey() {
  return dateKey(new Date());
}

export function isToday(value: string) {
  return value.slice(0, 10) === getTodayKey();
}

export function formatShortDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
