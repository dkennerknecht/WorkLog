"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/client-api";
import type { EntryDto, EntryVersionDto, SnapshotItem } from "@/types/domain";

type DiffResult = {
  added: string[];
  removed: string[];
  renamed: Array<{ before: string; after: string }>;
};

function buildDiff(previous: SnapshotItem[] | null, current: SnapshotItem[]): DiffResult {
  if (!previous) {
    return { added: [], removed: [], renamed: [] };
  }

  const previousById = new Map(previous.map((item) => [item.id, item.name]));
  const currentById = new Map(current.map((item) => [item.id, item.name]));

  const added: string[] = [];
  const removed: string[] = [];
  const renamed: Array<{ before: string; after: string }> = [];

  for (const item of current) {
    if (!previousById.has(item.id)) {
      added.push(item.name);
      continue;
    }

    const oldName = previousById.get(item.id);
    if (oldName && oldName !== item.name) {
      renamed.push({ before: oldName, after: item.name });
    }
  }

  for (const item of previous) {
    if (!currentById.has(item.id)) {
      removed.push(item.name);
    }
  }

  return { added, removed, renamed };
}

function DiffBlock({
  label,
  previous,
  current
}: {
  label: string;
  previous: SnapshotItem[] | null;
  current: SnapshotItem[];
}) {
  const diff = buildDiff(previous, current);
  const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.renamed.length > 0;

  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {!previous ? (
        <p className="text-sm text-slate-500">Erster Stand</p>
      ) : !hasChanges ? (
        <p className="text-sm text-slate-500">Keine Änderung</p>
      ) : (
        <div className="space-y-1 text-sm">
          {diff.added.length > 0 ? <p className="text-emerald-700">+ {diff.added.join(", ")}</p> : null}
          {diff.removed.length > 0 ? <p className="text-rose-700">- {diff.removed.join(", ")}</p> : null}
          {diff.renamed.map((rename) => (
            <p key={`${rename.before}-${rename.after}`} className="text-amber-700">
              ~ {rename.before} → {rename.after}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminEntriesPage() {
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [historyByEntryId, setHistoryByEntryId] = useState<Record<string, EntryVersionDto[]>>({});
  const [historyLoadingByEntryId, setHistoryLoadingByEntryId] = useState<Record<string, boolean>>({});
  const [historyErrorByEntryId, setHistoryErrorByEntryId] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const result = await apiFetch<{ entries: EntryDto[] }>(`/api/admin/entries?month=${month}`);
        if (!canceled) {
          setEntries(result.entries);
          setError(null);
        }
      } catch (err) {
        if (!canceled) {
          const message = err instanceof ApiError ? err.message : "Laden fehlgeschlagen";
          setError(message);
        }
      }
    }

    load();

    return () => {
      canceled = true;
    };
  }, [month]);

  const groupedCount = useMemo(() => entries.length, [entries.length]);

  async function loadHistory(entryId: string) {
    setHistoryLoadingByEntryId((current) => ({ ...current, [entryId]: true }));
    setHistoryErrorByEntryId((current) => ({ ...current, [entryId]: null }));

    try {
      const result = await apiFetch<{ versions: EntryVersionDto[] }>(`/api/admin/entries/${entryId}/history`);
      setHistoryByEntryId((current) => ({ ...current, [entryId]: result.versions }));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Versionen konnten nicht geladen werden";
      setHistoryErrorByEntryId((current) => ({ ...current, [entryId]: message }));
    } finally {
      setHistoryLoadingByEntryId((current) => ({ ...current, [entryId]: false }));
    }
  }

  async function toggleHistory(entryId: string) {
    if (openEntryId === entryId) {
      setOpenEntryId(null);
      return;
    }

    setOpenEntryId(entryId);

    if (historyByEntryId[entryId] || historyLoadingByEntryId[entryId]) {
      return;
    }

    await loadHistory(entryId);
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Einträge</h2>
          <p className="text-sm text-slate-600">{groupedCount} Einträge im gewählten Monat</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-700">Monat</span>
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </div>

      {error ? <p className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="py-2 pr-3">Datum</th>
              <th className="py-2 pr-3">Tätigkeiten</th>
              <th className="py-2 pr-3">Personen</th>
              <th className="py-2 pr-3">Orte</th>
              <th className="py-2 pr-3">Version</th>
              <th className="py-2">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isOpen = openEntryId === entry.id;
              const versions = historyByEntryId[entry.id] ?? [];
              const isLoadingHistory = Boolean(historyLoadingByEntryId[entry.id]);
              const historyError = historyErrorByEntryId[entry.id];

              return (
                <Fragment key={entry.id}>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-800">{format(new Date(entry.entryDate), "dd.MM.yyyy", { locale: de })}</td>
                    <td className="py-2 pr-3 text-slate-600">{entry.tasks.map((item) => item.name).join(", ")}</td>
                    <td className="py-2 pr-3 text-slate-600">{entry.people.map((item) => item.name).join(", ")}</td>
                    <td className="py-2 pr-3 text-slate-600">{entry.locations.map((item) => item.name).join(", ")}</td>
                    <td className="py-2 pr-3 text-slate-600">{entry.version}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="ghost" onClick={() => void toggleHistory(entry.id)}>
                          {isOpen ? "Änderungen ausblenden" : "Änderungen"}
                        </Button>
                        <Link href={`/admin/entries/${entry.id}`}>
                          <Button type="button" variant="secondary">
                            Bearbeiten
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <td colSpan={6} className="px-3 py-3">
                        {isLoadingHistory ? <p className="text-sm text-slate-600">Lade Versionshistorie...</p> : null}
                        {historyError ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{historyError}</p> : null}
                        {!isLoadingHistory && !historyError ? (
                          <div className="space-y-3">
                            {versions.length === 0 ? <p className="text-sm text-slate-600">Keine Versionsdaten vorhanden.</p> : null}
                            {versions.map((version, index) => {
                              const previous = index > 0 ? versions[index - 1] : null;

                              return (
                                <div key={version.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <Badge tone={version.isCurrent ? "success" : "muted"}>Version {version.version}</Badge>
                                    <span className="text-xs text-slate-500">
                                      {format(new Date(version.changedAt), "dd.MM.yyyy HH:mm", { locale: de })}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      von {version.changedBy?.trim() ? version.changedBy : "System/Kiosk"}
                                    </span>
                                  </div>

                                  {version.changeNote ? (
                                    <p className="mb-3 rounded-lg bg-slate-50 p-2 text-sm text-slate-700">{version.changeNote}</p>
                                  ) : null}

                                  <div className="grid gap-3 md:grid-cols-3">
                                    <DiffBlock label="Tätigkeiten" previous={previous?.tasks ?? null} current={version.tasks} />
                                    <DiffBlock label="Personen" previous={previous?.people ?? null} current={version.people} />
                                    <DiffBlock label="Orte" previous={previous?.locations ?? null} current={version.locations} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
