import { describe, expect, it } from "vitest";
import { canNavigateToNextMonth, getMonthDaysGrid, isDaySelectable, toDateString, todayDateOnly } from "@/lib/date";

describe("date helpers", () => {
  it("builds month grid with at least 28 days", () => {
    const grid = getMonthDaysGrid(new Date(2026, 0, 1));
    expect(grid.length).toBeGreaterThanOrEqual(28);
  });

  it("blocks future day selection", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isDaySelectable(tomorrow)).toBe(false);
  });

  it("allows navigation only up to current month", () => {
    const today = todayDateOnly();
    expect(canNavigateToNextMonth(today)).toBe(false);
  });

  it("formats date string as yyyy-MM-dd", () => {
    expect(toDateString(new Date(2026, 3, 11))).toBe("2026-04-11");
  });
});
