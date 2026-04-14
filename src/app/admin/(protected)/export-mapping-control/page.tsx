"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/client-api";
import type { ExportMappingControlResponse, ExportMappingCellDto } from "@/types/domain";

type MappingByKey = Map<string, ExportMappingCellDto>;

function buildMap(mappings: ExportMappingCellDto[]): MappingByKey {
  return new Map(mappings.map((mapping) => [`${mapping.exportLocationKey}::${mapping.taskId}`, mapping]));
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminExportMappingControlPage() {
  const [data, setData] = useState<ExportMappingControlResponse | null>(null);
  const [selectedLocationKey, setSelectedLocationKey] = useState("");
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch<ExportMappingControlResponse>("/api/admin/export/mapping-control");
        if (canceled) {
          return;
        }
        setData(response);
        setSelectedLocationKey(response.exportLocations[0]?.key ?? "");
      } catch (err) {
        if (canceled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : "Mapping-Kontrolle konnte nicht geladen werden.";
        setError(message);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      canceled = true;
    };
  }, []);

  const mappingByKey = useMemo(() => buildMap(data?.mappings ?? []), [data?.mappings]);

  const locationSummaries = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.exportLocations.map((location) => {
      const mappedCount = data.tasks.reduce((count, task) => {
        const key = `${location.key}::${task.id}`;
        return mappingByKey.has(key) ? count + 1 : count;
      }, 0);
      const totalCount = data.tasks.length;
      return {
        key: location.key,
        name: location.name,
        isVirtual: location.isVirtual,
        mappedCount,
        totalCount,
        missingCount: Math.max(0, totalCount - mappedCount)
      };
    });
  }, [data, mappingByKey]);

  const selectedLocation = useMemo(
    () => data?.exportLocations.find((location) => location.key === selectedLocationKey) ?? null,
    [data?.exportLocations, selectedLocationKey]
  );

  const selectedRows = useMemo(() => {
    if (!data || !selectedLocation) {
      return [];
    }

    const rows = data.tasks.map((task) => {
      const mapping = mappingByKey.get(`${selectedLocation.key}::${task.id}`) ?? null;
      return { task, mapping };
    });

    if (!showOnlyMissing) {
      return rows;
    }
    return rows.filter((row) => row.mapping === null);
  }, [data, selectedLocation, mappingByKey, showOnlyMissing]);

  if (loading) {
    return <Card className="p-4 text-sm text-slate-600">Lade Mapping-Kontrolle...</Card>;
  }

  if (error) {
    return <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>;
  }

  if (!data) {
    return <Card className="p-4 text-sm text-slate-600">Keine Daten verfügbar.</Card>;
  }

  return (
    <section className="space-y-4">
      <Card className="space-y-2 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Mapping-Kontrolle</h2>
        <p className="text-sm text-slate-600">
          Vollständigkeit des Export-Mappings je Ort und Tätigkeit prüfen. Grün bedeutet vorhanden, Rot bedeutet fehlend.
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-base font-semibold text-slate-900">Status pro Ort</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {locationSummaries.map((location) => {
            const selected = location.key === selectedLocationKey;
            const completion = location.totalCount === 0 ? 0 : Math.round((location.mappedCount / location.totalCount) * 100);
            return (
              <button
                key={location.key}
                type="button"
                onClick={() => setSelectedLocationKey(location.key)}
                className={`rounded-xl border p-3 text-left transition ${
                  selected ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {location.name}
                    {location.isVirtual ? " (virtuell)" : ""}
                  </p>
                  <span className={`rounded-full px-2 py-1 text-xs ${location.missingCount === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {location.mappedCount}/{location.totalCount}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${completion}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-600">{location.missingCount === 0 ? "Vollständig" : `${location.missingCount} fehlt`}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Matrix</h3>
          <p className="text-sm text-slate-600">
            {data.tasks.length} Tätigkeiten x {data.exportLocations.length} Orte
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-700">
                <th className="sticky left-0 z-10 bg-white py-2 pr-3">Tätigkeit</th>
                {data.exportLocations.map((location) => (
                  <th key={location.key} className="py-2 pr-3">
                    {location.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-100">
                  <td className="sticky left-0 bg-white py-2 pr-3 font-medium text-slate-800">{task.name}</td>
                  {data.exportLocations.map((location) => {
                    const mapping = mappingByKey.get(`${location.key}::${task.id}`) ?? null;
                    return (
                      <td key={location.key} className="py-2 pr-3">
                        <span
                          className={`inline-flex w-full min-w-[110px] items-center justify-center rounded-md border px-2 py-1 text-xs ${
                            mapping ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {mapping ? mapping.number : "fehlt"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            Details: {selectedLocation?.name ?? "-"}
            {selectedLocation?.isVirtual ? " (virtuell)" : ""}
          </h3>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showOnlyMissing}
              onChange={(event) => setShowOnlyMissing(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Nur fehlende anzeigen
          </label>
        </div>

        {selectedRows.length === 0 ? (
          <p className="text-sm text-slate-600">Keine Zeilen für den aktuellen Filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-700">
                  <th className="py-2 pr-3">Tätigkeit</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">number</th>
                  <th className="py-2 pr-3">productName</th>
                  <th className="py-2 pr-3">Zuletzt geändert</th>
                </tr>
              </thead>
              <tbody>
                {selectedRows.map(({ task, mapping }) => (
                  <tr key={task.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-800">{task.name}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          mapping ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {mapping ? "gemappt" : "fehlt"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-800">{mapping?.number ?? "-"}</td>
                    <td className="py-2 pr-3 text-slate-700">{mapping?.productName || "-"}</td>
                    <td className="py-2 pr-3 text-slate-700">{mapping ? formatDateTime(mapping.updatedAt) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
