"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/client-api";
import type { OptionItem, OptionsResponse } from "@/types/domain";

type MasterType = "tasks" | "people" | "locations";

const titleByType: Record<MasterType, string> = {
  tasks: "Tätigkeiten",
  people: "Personen",
  locations: "Orte"
};

const endpointByType: Record<MasterType, string> = {
  tasks: "/api/admin/tasks",
  people: "/api/admin/people",
  locations: "/api/admin/locations"
};

function Section({
  type,
  items,
  onCreate,
  onUpdate,
  onReorder,
  busy
}: {
  type: MasterType;
  items: OptionItem[];
  busy: boolean;
  onCreate: (type: MasterType, name: string) => Promise<void>;
  onUpdate: (type: MasterType, id: string, payload: { name?: string; isActive?: boolean }) => Promise<boolean>;
  onReorder: (type: MasterType, orderedIds: string[]) => Promise<boolean>;
}) {
  const [newName, setNewName] = useState("");
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [editingById, setEditingById] = useState<Record<string, boolean>>({});
  const [orderedItems, setOrderedItems] = useState<OptionItem[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  function reorderItems(list: OptionItem[], sourceId: string, targetId: string): OptionItem[] {
    const sourceIndex = list.findIndex((item) => item.id === sourceId);
    const targetIndex = list.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return list;
    }

    const next = [...list];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    return next;
  }

  async function handleDrop(sourceId: string | null, targetId: string) {
    if (!sourceId || sourceId === targetId) {
      setDragOverId(null);
      return;
    }

    const nextItems = reorderItems(orderedItems, sourceId, targetId);
    setOrderedItems(nextItems);
    setDraggingId(null);
    setDragOverId(null);

    const ok = await onReorder(
      type,
      nextItems.map((item) => item.id)
    );

    if (!ok) {
      setOrderedItems(items);
    }
  }

  return (
    <Card className="space-y-3 p-3">
      <h2 className="text-base font-semibold text-slate-900">{titleByType[type]}</h2>
      <p className="text-sm text-slate-600">Reihenfolge per Drag-and-Drop ändern. Diese Reihenfolge wird im Kiosk/Wizard übernommen.</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input className="h-10" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder={`${titleByType[type]} hinzufügen`} />
        <Button
          type="button"
          className="h-10 px-3"
          disabled={busy || newName.trim().length === 0}
          onClick={async () => {
            await onCreate(type, newName);
            setNewName("");
          }}
        >
          Anlegen
        </Button>
      </div>

      <div className="space-y-1.5">
        {orderedItems.map((item) => (
          <div
            key={item.id}
            draggable={!busy}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", item.id);
              setDraggingId(item.id);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverId(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) {
                setDragOverId(item.id);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (!busy) {
                const transferredId = event.dataTransfer.getData("text/plain");
                const sourceId = draggingId ?? (transferredId.length > 0 ? transferredId : null);
                void handleDrop(sourceId, item.id);
              }
            }}
            className={`flex flex-col gap-1.5 rounded-lg border p-2 transition sm:flex-row sm:items-center ${
              dragOverId === item.id ? "border-brand-500 bg-brand-50/40" : "border-slate-200"
            } ${busy ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
          >
            <div className="flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">⋮⋮</div>
            <div className="flex-1">
              {editingById[item.id] ? (
                <Input
                  className="h-9"
                  value={draftNames[item.id] ?? item.name}
                  onChange={(event) => setDraftNames((prev) => ({ ...prev, [item.id]: event.target.value }))}
                />
              ) : (
                <p className="px-1 text-sm font-medium text-slate-900">{item.name}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {item.isActive ? <Badge tone="success">aktiv</Badge> : <Badge tone="muted">deaktiviert</Badge>}
              <Button
                type="button"
                variant="secondary"
                className="h-9 px-3 text-xs"
                disabled={
                  busy ||
                  (editingById[item.id] &&
                    (((draftNames[item.id] ?? item.name).trim().length === 0) || (draftNames[item.id] ?? item.name).trim() === item.name))
                }
                onClick={async () => {
                  if (!editingById[item.id]) {
                    setEditingById((prev) => ({ ...prev, [item.id]: true }));
                    setDraftNames((prev) => ({ ...prev, [item.id]: prev[item.id] ?? item.name }));
                    return;
                  }

                  const nextName = (draftNames[item.id] ?? item.name).trim();
                  if (nextName.length === 0 || nextName === item.name) {
                    return;
                  }

                  const success = await onUpdate(type, item.id, { name: nextName });
                  if (success) {
                    setEditingById((prev) => ({ ...prev, [item.id]: false }));
                  }
                }}
              >
                {editingById[item.id] ? "Speichern" : "Umbenennen"}
              </Button>
              <Button
                type="button"
                variant={item.isActive ? "danger" : "secondary"}
                className="h-9 px-3 text-xs"
                disabled={busy}
                onClick={() => onUpdate(type, item.id, { isActive: !item.isActive })}
              >
                {item.isActive ? "Deaktivieren" : "Aktivieren"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminMasterDataPage() {
  const [data, setData] = useState<OptionsResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const result = await apiFetch<OptionsResponse>("/api/admin/options");
        if (!canceled) {
          setData(result);
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
  }, []);

  async function load() {
    const result = await apiFetch<OptionsResponse>("/api/admin/options");
    setData(result);
  }

  async function create(type: MasterType, name: string) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`${endpointByType[type]}`, {
        method: "POST",
        body: JSON.stringify({ name })
      });
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Speichern fehlgeschlagen";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function update(type: MasterType, id: string, payload: { name?: string; isActive?: boolean }): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`${endpointByType[type]}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      await load();
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Aktualisierung fehlgeschlagen";
      setError(message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function reorder(type: MasterType, orderedIds: string[]): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`${endpointByType[type]}`, {
        method: "PATCH",
        body: JSON.stringify({ orderedIds })
      });
      await load();
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Sortierung fehlgeschlagen";
      setError(message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return <Card className="p-4 text-sm text-slate-600">Lade Stammdaten...</Card>;
  }

  return (
    <section className="space-y-4">
      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      <Section type="tasks" items={data.tasks} onCreate={create} onUpdate={update} onReorder={reorder} busy={busy} />
      <Section type="people" items={data.people} onCreate={create} onUpdate={update} onReorder={reorder} busy={busy} />
      <Section type="locations" items={data.locations} onCreate={create} onUpdate={update} onReorder={reorder} busy={busy} />
    </section>
  );
}
