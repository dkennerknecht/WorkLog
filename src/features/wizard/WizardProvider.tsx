"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { WizardState } from "@/features/wizard/types";

type WizardContextValue = {
  state: WizardState;
  setDate: (date: string) => void;
  setTasks: (taskIds: string[]) => void;
  setPeople: (personIds: string[]) => void;
  setLocations: (locationIds: string[]) => void;
  markSubmitted: () => void;
  reset: () => void;
};

const initialState: WizardState = {
  selectedDate: null,
  selectedTasks: [],
  selectedPeople: [],
  selectedLocations: [],
  isSubmitted: false
};

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const value = useMemo<WizardContextValue>(
    () => ({
      state,
      setDate: (date) => setState((prev) => ({ ...prev, selectedDate: date, isSubmitted: false })),
      setTasks: (taskIds) => setState((prev) => ({ ...prev, selectedTasks: taskIds, isSubmitted: false })),
      setPeople: (personIds) => setState((prev) => ({ ...prev, selectedPeople: personIds, isSubmitted: false })),
      setLocations: (locationIds) => setState((prev) => ({ ...prev, selectedLocations: locationIds, isSubmitted: false })),
      markSubmitted: () => setState((prev) => ({ ...prev, isSubmitted: true })),
      reset: () => setState(initialState)
    }),
    [state]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within WizardProvider");
  }
  return context;
}
