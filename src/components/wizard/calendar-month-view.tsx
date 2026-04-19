"use client";

import { addMonths, format, isAfter } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  canNavigateToNextMonth,
  formatMonthGerman,
  getMonthDaysGrid,
  isCurrentDay,
  isDaySelectable,
  isVisibleInMonth,
  todayDateOnly,
  toDateString
} from "@/lib/date";

type CalendarMonthViewProps = {
  month: Date;
  selectedDate: string | null;
  markedDates: Set<string>;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string) => void;
  touchOptimized?: boolean;
};

const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function NavArrowIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M20 100 L170 100 M100 20 L20 100 L100 180" : "M30 100 L180 100 M100 20 L180 100 L100 180";
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className="h-8 w-8 lg:h-10 lg:w-10">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarMonthView({ month, selectedDate, markedDates, onMonthChange, onSelectDate, touchOptimized = false }: CalendarMonthViewProps) {
  const days = getMonthDaysGrid(month);
  const canGoForward = canNavigateToNextMonth(month);
  const today = todayDateOnly();

  return (
    <div className={cn("panel-strong rounded-2xl border border-slate-200 bg-white p-4 shadow-card", touchOptimized && "flex h-full min-h-0 flex-col p-3 lg:p-4")}>
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className={
            touchOptimized
              ? "h-14 min-w-14 rounded-2xl border-2 border-brand-500 bg-brand-100 p-0 text-brand-700 shadow-lg lg:h-16 lg:min-w-16"
              : ""
          }
        >
          <NavArrowIcon direction="left" />
        </Button>
        <h2 className={cn("font-semibold text-slate-900", touchOptimized ? "text-4xl lg:text-5xl" : "text-xl")}>{formatMonthGerman(month)}</h2>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onMonthChange(addMonths(month, 1))}
          disabled={!canGoForward}
          className={
            touchOptimized
              ? "h-14 min-w-14 rounded-2xl border-2 border-brand-500 bg-brand-100 p-0 text-brand-700 shadow-lg disabled:opacity-45 lg:h-16 lg:min-w-16"
              : ""
          }
        >
          <NavArrowIcon direction="right" />
        </Button>
      </div>

      <div className={cn("mb-1 grid grid-cols-7 gap-2 text-center font-semibold text-slate-500", touchOptimized ? "text-sm" : "text-sm")}>
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayString = toDateString(day);
          const inMonth = isVisibleInMonth(day, month);
          const selectable = inMonth && isDaySelectable(day);
          const isFutureDay = isAfter(day, today);
          const selected = selectedDate === dayString;
          const marked = markedDates.has(dayString);

          return (
            <button
              key={dayString}
              type="button"
              disabled={!selectable}
              onClick={() => onSelectDate(dayString)}
              className={cn(
                "calendar-choice relative flex h-12 items-center justify-center rounded-lg border text-sm font-medium transition",
                touchOptimized && "h-12 rounded-xl text-lg font-bold lg:h-14 lg:text-xl",
                isFutureDay && "font-normal",
                !inMonth && "opacity-30",
                selectable ? "border-slate-200 bg-white hover:border-brand-300" : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300",
                selected && "state-selected"
              )}
            >
              <span>{format(day, "d", { locale: de })}</span>
              {isCurrentDay(day) ? <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-brand-600" /> : null}
              {marked ? <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500" /> : null}
            </button>
          );
        })}
      </div>

      <div className={cn("mt-2 flex items-center gap-2 text-slate-500", touchOptimized ? "text-sm" : "text-sm")}>
        <Badge tone="success">●</Badge>
        <span>Tag mit Eintrag</span>
      </div>
    </div>
  );
}
