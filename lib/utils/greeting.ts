export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export function getGreeting(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
