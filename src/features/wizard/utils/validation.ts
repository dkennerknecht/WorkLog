import type { WizardState, WizardStep } from "@/features/wizard/types";

export function isStepValid(step: WizardStep, state: WizardState): boolean {
  switch (step) {
    case "calendar":
      return Boolean(state.selectedDate);
    case "tasks":
      return state.selectedTasks.length > 0;
    case "people":
      return state.selectedPeople.length > 0;
    case "locations":
      return state.selectedLocations.length > 0;
    case "review":
      return Boolean(state.selectedDate) && state.selectedTasks.length > 0 && state.selectedPeople.length > 0 && state.selectedLocations.length > 0;
    case "success":
      return state.isSubmitted;
    default:
      return false;
  }
}

export function getFirstInvalidStep(state: WizardState): WizardStep {
  if (!state.selectedDate) {
    return "calendar";
  }
  if (state.selectedTasks.length === 0) {
    return "tasks";
  }
  if (state.selectedPeople.length === 0) {
    return "people";
  }
  if (state.selectedLocations.length === 0) {
    return "locations";
  }
  return "review";
}

export function stepToPath(basePath: string, step: WizardStep): string {
  if (step === "calendar") {
    return basePath;
  }
  if (step === "success") {
    return `${basePath}/success`;
  }
  return `${basePath}/${step}`;
}
