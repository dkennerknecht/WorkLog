import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isFuture,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { de } from "date-fns/locale";

export const DATE_FORMAT = "yyyy-MM-dd";

export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function toDateString(date: Date): string {
  return format(date, DATE_FORMAT);
}

export function fromDateString(value: string): Date {
  return parseISO(value);
}

export function formatDateGerman(value: string): string {
  return format(fromDateString(value), "EEEE, dd. MMMM yyyy", { locale: de });
}

export function formatMonthGerman(date: Date): string {
  return format(date, "MMMM yyyy", { locale: de });
}

export function getMonthDaysGrid(month: Date): Date[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let current = gridStart;

  while (current <= gridEnd) {
    days.push(current);
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }

  return days;
}

export function canNavigateToNextMonth(currentMonth: Date): boolean {
  const now = todayDateOnly();
  const nextMonth = startOfMonth(addMonths(currentMonth, 1));
  return !isAfter(nextMonth, startOfMonth(now));
}

export function isDaySelectable(date: Date): boolean {
  return !isFuture(date) && !isAfter(date, todayDateOnly());
}

export function isVisibleInMonth(day: Date, month: Date): boolean {
  return isSameMonth(day, month);
}

export function isPastMonth(month: Date): boolean {
  return isBefore(startOfMonth(month), startOfMonth(todayDateOnly()));
}

export function isCurrentDay(date: Date): boolean {
  return isToday(date);
}
