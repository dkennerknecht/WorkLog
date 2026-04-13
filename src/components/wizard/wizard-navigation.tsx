"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type WizardNavigationProps = {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  lockNext?: boolean;
  disabledReason?: string;
  nextError?: string | null;
  loading?: boolean;
  touchOptimized?: boolean;
};

export function WizardNavigation({
  onBack,
  onNext,
  backLabel = "Zurück",
  nextLabel = "Weiter",
  nextDisabled,
  lockNext = false,
  disabledReason,
  nextError,
  loading,
  touchOptimized = false
}: WizardNavigationProps) {
  const [showHint, setShowHint] = useState(false);
  const [hintVersion, setHintVersion] = useState(0);

  useEffect(() => {
    if (!nextDisabled) {
      setShowHint(false);
    }
  }, [nextDisabled]);

  useEffect(() => {
    if (!showHint) {
      return;
    }
    const timer = window.setTimeout(() => {
      setShowHint(false);
    }, 7_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showHint, hintVersion]);

  const hintText = disabledReason ?? "Bitte zuerst alle Pflichtangaben ausfüllen.";
  const bubbleText = nextError ?? (showHint && nextDisabled ? hintText : null);
  const bubbleTone = nextError ? "error" : "warning";

  function handleNextClick() {
    if (loading) {
      return;
    }
    if (nextDisabled) {
      setShowHint(true);
      setHintVersion((current) => current + 1);
      return;
    }
    setShowHint(false);
    onNext?.();
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack} className={touchOptimized ? "h-14 min-w-44 px-6 text-lg" : "min-w-28"}>
            {backLabel}
          </Button>
        ) : (
          <div />
        )}
        <div className="relative w-full sm:w-auto">
          {bubbleText ? (
            <div role="status" aria-live="polite" className="pointer-events-none absolute right-0 bottom-full z-20 mb-3 w-max max-w-[90vw]">
              <div
                className={
                  bubbleTone === "error"
                    ? "rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 shadow-lg"
                    : "rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 shadow-lg"
                }
              >
                {bubbleText}
              </div>
              <span
                className={
                  bubbleTone === "error"
                    ? "absolute right-6 -bottom-1.5 h-3 w-3 rotate-45 border-r border-b border-rose-300 bg-rose-50"
                    : "absolute right-6 -bottom-1.5 h-3 w-3 rotate-45 border-r border-b border-amber-300 bg-amber-50"
                }
              />
            </div>
          ) : null}
          <Button
            type="button"
            onClick={handleNextClick}
            title={nextError ?? (nextDisabled ? hintText : undefined)}
            aria-disabled={Boolean(nextDisabled) || Boolean(lockNext) || Boolean(loading)}
            disabled={Boolean(loading) || Boolean(lockNext)}
            className={touchOptimized ? `h-14 min-w-44 px-6 text-lg ${nextDisabled || lockNext ? "btn-inactive" : ""}` : `min-w-28 ${nextDisabled || lockNext ? "btn-inactive" : ""}`}
          >
            {loading ? "Speichere..." : nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
