"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/client-api";
import type { ExportLocationOption, ExportTemplateDto, OptionItem } from "@/types/domain";

type ExportOptionsResponse = {
  defaultMonth: string;
  exportLocations: ExportLocationOption[];
  tasks: OptionItem[];
};

type ExportTemplatesResponse = {
  exportLocationKey: string;
  templates: ExportTemplateDto[];
};

type TemplateDraft = {
  number: string;
  productName: string;
  price: string;
  discount: string;
  uvp: string;
  unit: string;
  type: string;
  vatRateId: string;
  workHours: string;
  groupSku: string;
  groupName: string;
  groupIndex: string;
  productId: string;
  groupId: string;
};

function parseCsvDataLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.toLowerCase().startsWith("ewkitems -"))
    .filter((line) => !line.toLowerCase().startsWith("number;quantity;productname;description;"));
}

function parseCsvLineToDraft(line: string, fallbackTaskName: string): TemplateDraft {
  const parts = line.split(";");
  if (parts.length < 16) {
    throw new Error(`CSV-Zeile hat zu wenige Spalten (${parts.length}/16).`);
  }

  const value = (index: number) => (parts[index] ?? "").trim();

  return {
    number: value(0),
    productName: value(2) || fallbackTaskName,
    price: value(4),
    discount: value(5),
    uvp: value(6),
    unit: value(7),
    type: value(8),
    vatRateId: value(9),
    workHours: value(10),
    groupSku: value(11),
    groupName: value(12),
    groupIndex: value(13),
    productId: value(14),
    groupId: value(15)
  };
}

function draftToCsvLine(draft: TemplateDraft, taskName: string): string {
  return [
    draft.number,
    "1",
    draft.productName || taskName,
    "dd.MM.yyyy - X Personen",
    draft.price,
    draft.discount,
    draft.uvp,
    draft.unit,
    draft.type,
    draft.vatRateId,
    draft.workHours,
    draft.groupSku,
    draft.groupName,
    draft.groupIndex,
    draft.productId,
    draft.groupId
  ].join(";");
}

function defaultDraft(taskName: string): TemplateDraft {
  return {
    number: "",
    productName: taskName,
    price: "",
    discount: "",
    uvp: "",
    unit: "",
    type: "",
    vatRateId: "",
    workHours: "",
    groupSku: "",
    groupName: "",
    groupIndex: "",
    productId: "",
    groupId: ""
  };
}

export default function AdminExportMappingPage() {
  const [options, setOptions] = useState<ExportOptionsResponse | null>(null);
  const [selectedLocationKeys, setSelectedLocationKeys] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [csvInput, setCsvInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      try {
        const response = await apiFetch<ExportOptionsResponse>("/api/admin/export/options");
        if (canceled) {
          return;
        }

        setOptions(response);
        setSelectedLocationKeys(response.exportLocations[0]?.key ? [response.exportLocations[0].key] : []);
        setSelectedTaskIds(response.tasks[0]?.id ? [response.tasks[0].id] : []);
      } catch (err) {
        if (canceled) {
          return;
        }
        const message = err instanceof ApiError ? err.message : "Export-Mapping konnte nicht geladen werden.";
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

  const selectedTasksOrdered = useMemo(() => {
    if (!options) {
      return [];
    }
    return options.tasks.filter((task) => selectedTaskIds.includes(task.id));
  }, [options, selectedTaskIds]);

  function toggleLocation(locationKey: string) {
    setSelectedLocationKeys((current) => (current.includes(locationKey) ? current.filter((item) => item !== locationKey) : [...current, locationKey]));
  }

  function toggleTask(taskId: string) {
    setSelectedTaskIds((current) => (current.includes(taskId) ? current.filter((item) => item !== taskId) : [...current, taskId]));
  }

  async function loadFromExistingMapping() {
    if (!options) {
      return;
    }
    if (selectedLocationKeys.length !== 1) {
      setError("Zum Laden bitte genau einen Ort auswählen.");
      return;
    }
    if (selectedTasksOrdered.length === 0) {
      setError("Bitte mindestens eine Tätigkeit auswählen.");
      return;
    }

    try {
      setError(null);
      const exportLocationKey = selectedLocationKeys[0];
      const response = await apiFetch<ExportTemplatesResponse>(`/api/admin/export/templates?exportLocationKey=${encodeURIComponent(exportLocationKey)}`);
      const templateByTaskId = new Map(response.templates.map((template) => [template.taskId, template]));

      const lines = selectedTasksOrdered.map((task) => {
        const template = templateByTaskId.get(task.id);
        if (!template) {
          return draftToCsvLine(defaultDraft(task.name), task.name);
        }

        return draftToCsvLine(
          {
            number: template.number,
            productName: template.productName,
            price: template.price,
            discount: template.discount,
            uvp: template.uvp,
            unit: template.unit,
            type: template.type,
            vatRateId: template.vatRateId,
            workHours: template.workHours,
            groupSku: template.groupSku,
            groupName: template.groupName,
            groupIndex: template.groupIndex,
            productId: template.productId,
            groupId: template.groupId
          },
          task.name
        );
      });

      setCsvInput(lines.join("\n"));
      setSuccess("Bestehendes Mapping in das CSV-Feld geladen.");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Mapping konnte nicht geladen werden.";
      setError(message);
    }
  }

  async function saveMapping() {
    if (!options) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedLocationKeys.length === 0) {
        throw new Error("Bitte mindestens einen Ort auswählen.");
      }
      if (selectedTasksOrdered.length === 0) {
        throw new Error("Bitte mindestens eine Tätigkeit auswählen.");
      }

      const lines = parseCsvDataLines(csvInput);
      if (lines.length === 0) {
        throw new Error("Bitte mindestens eine CSV-Zeile eingeben.");
      }

      let draftByTaskId = new Map<string, TemplateDraft>();

      if (lines.length === 1) {
        const lineDraft = parseCsvLineToDraft(lines[0], selectedTasksOrdered[0]?.name ?? "");
        for (const task of selectedTasksOrdered) {
          draftByTaskId.set(task.id, {
            ...lineDraft,
            productName: lineDraft.productName || task.name
          });
        }
      } else if (lines.length === selectedTasksOrdered.length) {
        selectedTasksOrdered.forEach((task, index) => {
          const parsed = parseCsvLineToDraft(lines[index], task.name);
          draftByTaskId.set(task.id, parsed);
        });
      } else {
        throw new Error("Anzahl CSV-Zeilen muss 1 oder gleich der Anzahl ausgewählter Tätigkeiten sein.");
      }

      const emptyNumberTask = selectedTasksOrdered.find((task) => (draftByTaskId.get(task.id)?.number ?? "").trim().length === 0);
      if (emptyNumberTask) {
        throw new Error(`Für "${emptyNumberTask.name}" fehlt number.`);
      }

      const requests = selectedLocationKeys.flatMap((exportLocationKey) =>
        selectedTasksOrdered.map((task) => {
          const draft = draftByTaskId.get(task.id);
          if (!draft) {
            throw new Error("Interner Fehler: Draft fehlt.");
          }

          return apiFetch("/api/admin/export/templates", {
            method: "PUT",
            body: JSON.stringify({
              exportLocationKey,
              taskId: task.id,
              ...draft
            })
          });
        })
      );

      await Promise.all(requests);
      setSuccess(`Mapping gespeichert für ${selectedLocationKeys.length} Ort(e) und ${selectedTasksOrdered.length} Tätigkeit(en).`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Speichern fehlgeschlagen.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !options) {
    return <Card className="p-4 text-sm text-slate-600">Lade Export-Mapping...</Card>;
  }

  return (
    <section className="space-y-4">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Export-Mapping</h2>
          <Link href="/admin/export-mapping-control" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-brand-300 hover:text-slate-900">
            Zur Mapping-Kontrolle
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          Orte und Tätigkeiten auswählen, CSV einfügen und in einem Schritt speichern. Kappelenweg wird über die virtuellen Orte
          <strong> Altersheim</strong> und <strong>Kappellenweg</strong> abgebildet.
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-base font-semibold text-slate-900">Orte (Multiselect)</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.exportLocations.map((location) => {
            const selected = selectedLocationKeys.includes(location.key);
            return (
              <button
                key={location.key}
                type="button"
                onClick={() => toggleLocation(location.key)}
                className={`kiosk-choice rounded-xl border px-3 py-2 text-left text-sm transition ${
                  selected ? "state-selected" : "border-slate-300 bg-white hover:border-brand-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{location.name}</span>
                  {location.isVirtual ? <Badge tone="neutral">virtuell</Badge> : null}
                </div>
              </button>
            );
          })}
        </div>

        <h3 className="pt-2 text-base font-semibold text-slate-900">Tätigkeiten (Multiselect)</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {options.tasks.map((task) => {
            const selected = selectedTaskIds.includes(task.id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`kiosk-choice rounded-xl border px-3 py-2 text-left text-sm transition ${
                  selected ? "state-selected" : "border-slate-300 bg-white hover:border-brand-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{task.name}</span>
                  {task.isActive ? <Badge tone="success">aktiv</Badge> : <Badge tone="muted">deaktiviert</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-base font-semibold text-slate-900">CSV-Eingabe</h3>
        <p className="text-sm text-slate-600">
          Eine oder mehrere Datenzeilen einfügen. Regel: 1 Zeile = auf alle gewählten Tätigkeiten anwenden, oder exakt eine Zeile je
          gewählter Tätigkeit.
        </p>
        <Textarea
          value={csvInput}
          onChange={(event) => setCsvInput(event.target.value)}
          rows={12}
          placeholder="HAUS 011;1;Streuen;;0;0;18;wu;work;...;"
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={loadFromExistingMapping}>
            Aus bestehendem Mapping laden
          </Button>
          <Button type="button" onClick={saveMapping} disabled={saving}>
            {saving ? "Speichere..." : "Mapping speichern"}
          </Button>
        </div>
      </Card>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
    </section>
  );
}
