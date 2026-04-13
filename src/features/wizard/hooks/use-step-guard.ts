"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/features/wizard/WizardProvider";
import type { WizardStep } from "@/features/wizard/types";
import { getFirstInvalidStep, stepToPath } from "@/features/wizard/utils/validation";

function stepOrder(step: WizardStep): number {
  switch (step) {
    case "calendar":
      return 0;
    case "tasks":
      return 1;
    case "people":
      return 2;
    case "locations":
      return 3;
    case "review":
      return 4;
    case "success":
      return 5;
    default:
      return 99;
  }
}

export function useStepGuard(step: WizardStep, basePath: string) {
  const { state } = useWizard();
  const router = useRouter();

  useEffect(() => {
    if (step === "calendar") {
      return;
    }

    if (step === "success") {
      if (!state.isSubmitted) {
        router.replace(basePath);
      }
      return;
    }

    const firstInvalid = getFirstInvalidStep(state);
    if (stepOrder(step) > stepOrder(firstInvalid)) {
      router.replace(stepToPath(basePath, firstInvalid));
    }
  }, [basePath, router, state, step]);
}
