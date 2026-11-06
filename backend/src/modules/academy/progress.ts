import { ForbiddenException } from "@nestjs/common";

export function assertSequence(lessonIds: string[], completedIds: string[], target: string) {
  const index = lessonIds.indexOf(target);
  if (index < 0 || lessonIds.slice(0, index).some((id) => !completedIds.includes(id))) {
    throw new ForbiddenException("Complete the preceding sections before opening this lesson.");
  }
}
export function streaks(dates: Date[], now = new Date()) {
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const days = new Set(dates.map(day));
  let current = new Date(`${day(now)}T00:00:00Z`);
  if (!days.has(day(current))) current = new Date(current.getTime() - 86400000);
  let daily = 0;
  while (days.has(day(current))) { daily++; current = new Date(current.getTime() - 86400000); }
  const week = (date: Date) => {
    const start = new Date(`${day(date)}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
    return day(start);
  };
  const weeks = new Set(dates.map(week));
  let cursor = new Date(`${week(now)}T00:00:00Z`);
  if (!weeks.has(day(cursor))) cursor = new Date(cursor.getTime() - 7 * 86400000);
  let weekly = 0;
  while (weeks.has(day(cursor))) { weekly++; cursor = new Date(cursor.getTime() - 7 * 86400000); }
  return { daily, weekly };
}