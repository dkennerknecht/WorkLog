"use client";

import { useEffect, useMemo, useState } from "react";
import { startOfMonth } from "date-fns";
import { useRouter } from "next/navigation";
import { DayEntriesPanel } from "@/components/wizard/day-entries-panel";
import { CalendarMonthView } from "@/components/wizard/calendar-month-view";
import { StepLayout } from "@/components/wizard/step-layout";
import { MultiSelectList } from "@/components/wizard/multi-select-list";
import { WizardNavigation } from "@/components/wizard/wizard-navigation";
import { SummaryCard } from "@/components/wizard/summary-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/client-api";
import { formatDateGerman, toDateString, todayDateOnly } from "@/lib/date";
import { useWizard } from "@/features/wizard/WizardProvider";
import { useStepGuard } from "@/features/wizard/hooks/use-step-guard";
import type { EntryDto, OptionsResponse } from "@/types/domain";

function useOptions(activeOnly = true) {
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      try {
        const route = activeOnly ? "/api/options" : "/api/admin/options";
        const response = await apiFetch<OptionsResponse>(route);
        if (!canceled) {
          setOptions(response);
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      canceled = true;
    };
  }, [activeOnly]);

  return { options, loading };
}

type ScreenProps = {
  basePath: "/kiosk" | "/wizard";
};

export function CalendarScreen({ basePath }: ScreenProps) {
  useStepGuard("calendar", basePath);
  const router = useRouter();
  const { state, setDate } = useWizard();
  const isKiosk = basePath === "/kiosk";
  const [currentTime, setCurrentTime] = useState(() =>
    new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date())
  );
  const [month, setMonth] = useState(() => startOfMonth(todayDateOnly()));
  const [activeDate, setActiveDate] = useState<string>(state.selectedDate ?? toDateString(todayDateOnly()));
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
    }, 15_000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    async function loadMarks() {
      const monthValue = toDateString(month).slice(0, 7);
      const data = await apiFetch<{ dates: string[] }>(`/api/entries?month=${monthValue}`);
      if (!canceled) {
        setMarkedDates(new Set(data.dates));
      }
    }

    loadMarks();

    return () => {
      canceled = true;
    };
  }, [month]);

  useEffect(() => {
    let canceled = false;
    async function loadEntries() {
      const data = await apiFetch<{ entries: EntryDto[] }>(`/api/entries?date=${activeDate}`);
      if (!canceled) {
        setEntries(data.entries);
      }
    }
    loadEntries();

    return () => {
      canceled = true;
    };
  }, [activeDate]);

  function continueToTasks() {
    if (!activeDate) {
      return;
    }
    setDate(activeDate);
    router.push(`${basePath}/tasks`);
  }

  return (
    <section className={isKiosk ? "mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-3" : "mx-auto w-full max-w-7xl space-y-4"}>
      <Card className={isKiosk ? "h-24 px-4 lg:h-28 lg:px-5" : "p-4"}>
        <div className="flex h-full items-center justify-between gap-4">
          <h1 className={isKiosk ? "text-4xl leading-none font-semibold text-slate-900 lg:text-6xl" : "text-xl font-semibold text-slate-900"}>
            Tagesaufgaben erfassen
          </h1>
          {isKiosk ? <p className="text-4xl leading-none font-semibold text-slate-900 lg:text-6xl">{currentTime}</p> : null}
        </div>
      </Card>

      <div
        className={
          isKiosk
            ? "grid min-h-0 flex-1 grid-cols-1 items-stretch gap-3 overflow-hidden lg:grid-cols-[2fr_3fr]"
            : "grid grid-cols-1 items-start gap-4 lg:grid-cols-[2fr_3fr]"
        }
      >
        <div className={isKiosk ? "min-h-0 h-full min-w-0" : "min-w-0"}>
          <CalendarMonthView
            month={month}
            selectedDate={activeDate}
            markedDates={markedDates}
            onMonthChange={setMonth}
            touchOptimized={isKiosk}
            onSelectDate={(date) => {
              setActiveDate(date);
            }}
          />
        </div>
        <div className={isKiosk ? "min-h-0 h-full min-w-0" : "min-w-0"}>
          <DayEntriesPanel date={activeDate} entries={entries} touchOptimized={isKiosk} />
        </div>
      </div>

      <WizardNavigation
        onNext={continueToTasks}
        nextDisabled={!activeDate}
        disabledReason="Bitte zuerst ein Datum auswählen."
        touchOptimized={isKiosk}
        className={isKiosk ? "mt-auto pb-[max(2px,env(safe-area-inset-bottom))]" : undefined}
      />
    </section>
  );
}

export function TasksScreen({ basePath }: ScreenProps) {
  useStepGuard("tasks", basePath);
  const router = useRouter();
  const isKiosk = basePath === "/kiosk";
  const { state, setTasks } = useWizard();
  const { options, loading } = useOptions(true);

  return (
    <StepLayout
      title="Tätigkeit auswählen"
      description="Mindestens eine Tätigkeit wählen."
      kiosk={isKiosk}
      navigation={
        <WizardNavigation
          onBack={() => router.push(basePath)}
          onNext={() => router.push(`${basePath}/people`)}
          nextDisabled={state.selectedTasks.length === 0}
          disabledReason="Bitte mindestens eine Tätigkeit auswählen."
          touchOptimized={isKiosk}
          className={isKiosk ? "mt-auto pb-[max(2px,env(safe-area-inset-bottom))]" : undefined}
        />
      }
    >
      {loading || !options ? (
        <p className={isKiosk ? "text-base text-slate-500" : "text-sm text-slate-500"}>Lade Optionen...</p>
      ) : (
        <div className={isKiosk ? "h-full min-h-0" : ""}>
          <MultiSelectList
            items={options.tasks}
            selected={state.selectedTasks}
            onChange={setTasks}
            touchOptimized={isKiosk}
            fillHeight={isKiosk}
            touchColumns={3}
          />
        </div>
      )}
    </StepLayout>
  );
}

export function PeopleScreen({ basePath }: ScreenProps) {
  useStepGuard("people", basePath);
  const router = useRouter();
  const isKiosk = basePath === "/kiosk";
  const { state, setPeople } = useWizard();
  const { options, loading } = useOptions(true);

  return (
    <StepLayout
      title="Person auswählen"
      description="Mindestens eine Person wählen."
      kiosk={isKiosk}
      navigation={
        <WizardNavigation
          onBack={() => router.push(`${basePath}/tasks`)}
          onNext={() => router.push(`${basePath}/locations`)}
          nextDisabled={state.selectedPeople.length === 0}
          disabledReason="Bitte mindestens eine Person auswählen."
          touchOptimized={isKiosk}
          className={isKiosk ? "mt-auto pb-[max(2px,env(safe-area-inset-bottom))]" : undefined}
        />
      }
    >
      {loading || !options ? (
        <p className={isKiosk ? "text-base text-slate-500" : "text-sm text-slate-500"}>Lade Optionen...</p>
      ) : (
        <div className={isKiosk ? "h-full min-h-0" : ""}>
          <MultiSelectList
            items={options.people}
            selected={state.selectedPeople}
            onChange={setPeople}
            touchOptimized={isKiosk}
            fillHeight={isKiosk}
            touchColumns={2}
          />
        </div>
      )}
    </StepLayout>
  );
}

export function LocationsScreen({ basePath }: ScreenProps) {
  useStepGuard("locations", basePath);
  const router = useRouter();
  const isKiosk = basePath === "/kiosk";
  const { state, setLocations } = useWizard();
  const { options, loading } = useOptions(true);

  return (
    <StepLayout
      title="Ort auswählen"
      description="Mindestens einen Ort wählen."
      kiosk={isKiosk}
      navigation={
        <WizardNavigation
          onBack={() => router.push(`${basePath}/people`)}
          onNext={() => router.push(`${basePath}/review`)}
          nextDisabled={state.selectedLocations.length === 0}
          disabledReason="Bitte mindestens einen Ort auswählen."
          touchOptimized={isKiosk}
          className={isKiosk ? "mt-auto pb-[max(2px,env(safe-area-inset-bottom))]" : undefined}
        />
      }
    >
      {loading || !options ? (
        <p className={isKiosk ? "text-base text-slate-500" : "text-sm text-slate-500"}>Lade Optionen...</p>
      ) : (
        <div className={isKiosk ? "flex h-full min-h-0 flex-col" : ""}>
          <div className={isKiosk ? "mb-4 flex flex-wrap gap-3" : "mb-3 flex flex-wrap gap-2"}>
            <Button
              type="button"
              variant="secondary"
              className={isKiosk ? "h-14 px-6 text-lg" : ""}
              onClick={() => setLocations(options.locations.map((item) => item.id))}
            >
              Alle auswählen
            </Button>
            <Button type="button" variant="ghost" className={isKiosk ? "h-14 px-6 text-lg" : ""} onClick={() => setLocations([])}>
              Alle abwählen
            </Button>
          </div>
          <div className={isKiosk ? "min-h-0 flex-1" : ""}>
            <MultiSelectList
              items={options.locations}
              selected={state.selectedLocations}
              onChange={setLocations}
              touchOptimized={isKiosk}
              fillHeight={isKiosk}
              touchColumns={3}
            />
          </div>
        </div>
      )}
    </StepLayout>
  );
}

export function ReviewScreen({ basePath }: ScreenProps) {
  useStepGuard("review", basePath);
  const router = useRouter();
  const isKiosk = basePath === "/kiosk";
  const { state, markSubmitted } = useWizard();
  const { options } = useOptions(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitLocked, setSubmitLocked] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSubmitLocked(true);
    const timer = window.setTimeout(() => {
      setSubmitLocked(false);
    }, 1_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const mapped = useMemo(() => {
    if (!options) {
      return { tasks: [], people: [], locations: [] };
    }

    const mapNames = (ids: string[], list: { id: string; name: string }[]) => ids.map((id) => list.find((item) => item.id === id)?.name).filter(Boolean) as string[];

    return {
      tasks: mapNames(state.selectedTasks, options.tasks),
      people: mapNames(state.selectedPeople, options.people),
      locations: mapNames(state.selectedLocations, options.locations)
    };
  }, [options, state.selectedLocations, state.selectedPeople, state.selectedTasks]);

  async function submit() {
    if (!state.selectedDate) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        date: state.selectedDate,
        taskIds: state.selectedTasks,
        personIds: state.selectedPeople,
        locationIds: state.selectedLocations
      };
      console.log("Submitting entry", payload);
      await apiFetch<{ entry: EntryDto }>("/api/entries", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      markSubmitted();
      router.push(`${basePath}/success`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Absenden fehlgeschlagen";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <StepLayout
      title="Übersicht"
      description="Daten prüfen und absenden."
      kiosk={isKiosk}
      navigation={
        <WizardNavigation
          onBack={() => router.push(`${basePath}/locations`)}
          onNext={submit}
          nextLabel="Absenden"
          loading={isSubmitting}
          lockNext={submitLocked}
          nextError={error}
          nextDisabled={!state.selectedDate || state.selectedTasks.length === 0 || state.selectedPeople.length === 0 || state.selectedLocations.length === 0}
          disabledReason="Bitte alle Pflichtfelder ausfüllen, bevor du absendest."
          touchOptimized={isKiosk}
          className={isKiosk ? "mt-auto pb-[max(2px,env(safe-area-inset-bottom))]" : undefined}
        />
      }
    >
      <div className={isKiosk ? "grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-2 md:auto-rows-fr" : "space-y-3"}>
        <SummaryCard title="Datum" items={state.selectedDate ? [formatDateGerman(state.selectedDate)] : []} touchOptimized={isKiosk} fillHeight={isKiosk} />
        <SummaryCard title="Tätigkeiten" items={mapped.tasks} touchOptimized={isKiosk} fillHeight={isKiosk} />
        <SummaryCard title="Personen" items={mapped.people} touchOptimized={isKiosk} fillHeight={isKiosk} />
        <SummaryCard title="Orte" items={mapped.locations} touchOptimized={isKiosk} fillHeight={isKiosk} />
      </div>
    </StepLayout>
  );
}

export function SuccessScreen({ basePath }: ScreenProps) {
  useStepGuard("success", basePath);
  const router = useRouter();
  const isKiosk = basePath === "/kiosk";
  const { reset } = useWizard();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      reset();
      router.replace(basePath);
    }, 10_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [basePath, reset, router]);

  return (
    <StepLayout
      title="Erfolgreich gespeichert"
      description="Der Eintrag wurde gespeichert."
      kiosk={isKiosk}
      navigation={
        <WizardNavigation
          onNext={() => {
            reset();
            router.push(basePath);
          }}
          nextLabel="Neuer Eintrag"
          touchOptimized={isKiosk}
          className={isKiosk ? "mt-auto pb-[max(2px,env(safe-area-inset-bottom))]" : undefined}
        />
      }
    >
      <div className={isKiosk ? "flex h-full min-h-0 items-center justify-center px-4 text-center" : ""}>
        <div className={isKiosk ? "w-full max-w-3xl space-y-4" : "space-y-3"}>
          <p className={isKiosk ? "rounded-xl bg-emerald-50 p-5 text-lg text-emerald-800" : "rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"}>
            Die Erfassung wurde erfolgreich abgeschlossen.
          </p>
          <p className={isKiosk ? "text-lg text-slate-600" : "text-sm text-slate-600"}>Automatische Rückleitung zum Kalender in 10 Sekunden.</p>
        </div>
      </div>
    </StepLayout>
  );
}
