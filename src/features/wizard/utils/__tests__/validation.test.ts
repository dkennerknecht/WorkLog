import { describe, expect, it } from "vitest";
import { getFirstInvalidStep, isStepValid, stepToPath } from "@/features/wizard/utils/validation";
import type { WizardState } from "@/features/wizard/types";

const emptyState: WizardState = {
  selectedDate: null,
  selectedTasks: [],
  selectedPeople: [],
  selectedLocations: [],
  isSubmitted: false
};

describe("wizard validation", () => {
  it("finds first invalid step in order", () => {
    expect(getFirstInvalidStep(emptyState)).toBe("calendar");
    expect(
      getFirstInvalidStep({
        ...emptyState,
        selectedDate: "2026-01-01"
      })
    ).toBe("tasks");
  });

  it("validates review only when all selections exist", () => {
    const validState: WizardState = {
      selectedDate: "2026-01-01",
      selectedTasks: ["a"],
      selectedPeople: ["b"],
      selectedLocations: ["c"],
      isSubmitted: false
    };

    expect(isStepValid("review", validState)).toBe(true);
    expect(isStepValid("review", { ...validState, selectedLocations: [] })).toBe(false);
  });

  it("maps step to route path", () => {
    expect(stepToPath("/kiosk", "calendar")).toBe("/kiosk");
    expect(stepToPath("/kiosk", "people")).toBe("/kiosk/people");
  });
});
