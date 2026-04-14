"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/client-api";
import type { ExportLocationOption, ExportPreviewResponse, OptionItem } from "@/types/domain";

type ExportOptionsResponse = {
  defaultMonth: string;
  exportLocations: ExportLocationOption[];
  tasks: OptionItem[];
};

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!copied) {
      throw new Error("Kopieren nicht möglich.");
    }
    return;
  }

  throw new Error("Kopieren nicht möglich.");
}

export default function AdminExportPage() {
  const [options, setOptions] = useState<ExportOptionsResponse | null>(null);
  const [month, setMonth] = useState("");
  const [exportLocationKey, setExportLocationKey] = useState("");
  const [preview, setPreview] = useState<ExportPreviewResponse | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoadingOptions(true);
      try {
        const response = await apiFetch<ExportOptionsResponse>("/api/admin/export/options");
        if (canceled) {
          return;
        }

        setOptions(response);
        setMonth(response.defaultMonth);
        setExportLocationKey(response.exportLocations[0]?.key ?? "");
      } catch (err) {
        if (canceled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : "Export-Optionen konnten nicht geladen werden.";
        setError(message);
      } finally {
        if (!canceled) {
          setLoadingOptions(false);
        }
      }
    }

    void load();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!month || !exportLocationKey) {
      return;
    }

    let canceled = false;

    async function loadPreview() {
      setLoadingPreview(true);
      setError(null);
      setCopySuccess(null);

      try {
        const response = await apiFetch<ExportPreviewResponse>("/api/admin/export/preview", {
          method: "POST",
          body: JSON.stringify({ month, exportLocationKey })
        });
        if (!canceled) {
          setPreview(response);
        }
      } catch (err) {
        if (canceled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : "Export-Vorschau konnte nicht geladen werden.";
        setError(message);
        setPreview(null);
      } finally {
        if (!canceled) {
          setLoadingPreview(false);
        }
      }
    }

    void loadPreview();

    return () => {
      canceled = true;
    };
  }, [exportLocationKey, month]);

  async function copyToClipboard() {
    if (!preview?.clipboardText) {
      return;
    }

    setCopying(true);
    setCopySuccess(null);
    setError(null);

    try {
      await copyTextToClipboard(preview.clipboardText);
      setCopySuccess("Exportdaten wurden in die Zwischenablage kopiert.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kopieren fehlgeschlagen.";
      setError(message);
    } finally {
      setCopying(false);
    }
  }

  if (loadingOptions || !options) {
    return <Card className="p-4 text-sm text-slate-600">Lade Export...</Card>;
  }

  return (
    <section className="space-y-4">
      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold text-slate-900">Monats-Export</h2>
        <p className="text-sm text-slate-600">Monat und Export-Ort wählen, Vorschau prüfen und als easyWerkstatt-Format kopieren.</p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">Monat</span>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-700">Export-Ort</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              value={exportLocationKey}
              onChange={(event) => setExportLocationKey(event.target.value)}
            >
              {options.exportLocations.map((location) => (
                <option key={location.key} value={location.key}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <Button
            type="button"
            onClick={copyToClipboard}
            disabled={copying || loadingPreview || !preview?.canCopy || !preview.clipboardText}
          >
            {copying ? "Kopiere..." : "Copy to Clipboard"}
          </Button>
        </div>
      </Card>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {copySuccess ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{copySuccess}</p> : null}

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Vorschau</h3>
          <span className="text-sm text-slate-600">{loadingPreview ? "Aktualisiere..." : `${preview?.rows.length ?? 0} Zeile(n)`}</span>
        </div>

        {preview?.missingMappings.length ? (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Fehlende Mappings für: {preview.missingMappings.map((item) => item.taskName).join(", ")}. Export ist blockiert.
          </p>
        ) : null}

        {preview && preview.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-3">Datum</th>
                  <th className="py-2 pr-3">Tätigkeit</th>
                  <th className="py-2 pr-3">quantity</th>
                  <th className="py-2 pr-3">description</th>
                  <th className="py-2 pr-3">number</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={`${row.date}-${row.taskId}`} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-800">{row.date}</td>
                    <td className="py-2 pr-3 text-slate-800">{row.taskName}</td>
                    <td className="py-2 pr-3 text-slate-800">{row.quantity}</td>
                    <td className="py-2 pr-3 text-slate-700">{row.description}</td>
                    <td className="py-2 pr-3 text-slate-700">{row.number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-600">{loadingPreview ? "Lade Vorschau..." : "Keine Daten für diese Auswahl."}</p>
        )}
      </Card>
    </section>
  );
}

