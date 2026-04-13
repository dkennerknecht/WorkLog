export type WizardState = {
  selectedDate: string | null;
  selectedTasks: string[];
  selectedPeople: string[];
  selectedLocations: string[];
  isSubmitted: boolean;
};

export type WizardStep = "calendar" | "tasks" | "people" | "locations" | "review" | "success";
