"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MultiSelectList } from "@/components/wizard/multi-select-list";
import { apiFetch, ApiError } from "@/lib/client-api";
import type { EntryDto, OptionsResponse } from "@/types/domain";

export default function AdminEntryEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDto | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [date, setDate] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let canceled = false;

    async function load() {
      const [entryData, optionsData] = await Promise.all([
        apiFetch<{ entry: EntryDto }>(`/api/admin/entries/${id}`),
        apiFetch<OptionsResponse>("/api/admin/options")
      ]);

      if (canceled) {
        return;
      }

      setEntry(entryData.entry);
      setOptions(optionsData);
      setDate(entryData.entry.entryDate);
      setTaskIds(entryData.entry.tasks.map((item) => item.id));
      setPersonIds(entryData.entry.people.map((item) => item.id));
      setLocationIds(entryData.entry.locations.map((item) => item.id));
    }

    load().catch((err) => {
      if (canceled) {
        return;
      }
      const message = err instanceof ApiError ? err.message : "Laden fehlgeschlagen";
      setError(message);
    });

    return () => {
      canceled = true;
    };
  }, [id]);

  async function save() {
    setLoading(true);
    setError(null);

    try {
      await apiFetch<{ entry: EntryDto }>(`/api/admin/entries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          date,
          taskIds,
          personIds,
          locationIds,
          changeNote: note || null
        })
      });

      router.replace("/admin/entries");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Speichern fehlgeschlagen";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!entry || !options) {
    return <Card className="p-4 text-sm text-slate-600">Lade Eintrag...</Card>;
  }

  return (
    <section className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-slate-900">Eintrag bearbeiten</h2>
        <p className="text-sm text-slate-600">Eintrag-ID: {entry.id}</p>
      </Card>

      <Card className="space-y-4 p-4">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Datum</span>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Tätigkeiten</p>
          <MultiSelectList items={options.tasks} selected={taskIds} onChange={setTaskIds} allowInactive />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Personen</p>
          <MultiSelectList items={options.people} selected={personIds} onChange={setPersonIds} allowInactive />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Orte</p>
          <MultiSelectList items={options.locations} selected={locationIds} onChange={setLocationIds} allowInactive />
        </div>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Änderungsnotiz (optional)</span>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </label>

        {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={save}
            disabled={loading || !date || taskIds.length === 0 || personIds.length === 0 || locationIds.length === 0}
          >
            {loading ? "Speichere..." : "Neue Version speichern"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/entries")}>
            Zurück
          </Button>
        </div>
      </Card>
    </section>
  );
}
