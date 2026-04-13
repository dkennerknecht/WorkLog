"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/client-api";
import { cn } from "@/lib/cn";

type Palette = "blue" | "emerald" | "amber" | "violet" | "navy" | "jade";
type Mode = "light" | "dark";

type UiSettings = {
  kioskPalette: Palette;
  kioskMode: Mode;
  adminPalette: Palette;
  adminMode: Mode;
};

type SettingsResponse = {
  settings: UiSettings;
  palettes: Palette[];
  modes: Mode[];
};

const paletteLabel: Record<Palette, string> = {
  blue: "Blue",
  emerald: "Emerald",
  amber: "Amber",
  violet: "Violet",
  navy: "Navy",
  jade: "Jade"
};

const palettePreviewColor: Record<Palette, string> = {
  blue: "#2b508c",
  emerald: "#059669",
  amber: "#d97706",
  violet: "#7c3aed",
  navy: "oklch(44.245% 0.11134 251.12)",
  jade: "oklch(0.637 0.124 246.59)"
};

const modeLabel: Record<Mode, string> = {
  light: "Light",
  dark: "Dark"
};

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  labels
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-700">{label}</span>
      <select
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </label>
  );
}

function PaletteField({
  label,
  value,
  options,
  onChange,
  labels
}: {
  label: string;
  value: Palette;
  options: Palette[];
  onChange: (value: Palette) => void;
  labels: Record<Palette, string>;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm text-slate-700">{label}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "kiosk-choice flex h-11 items-center gap-3 rounded-xl border px-3 text-sm text-slate-900 transition",
                isSelected ? "state-selected" : "border-slate-300 bg-white hover:border-brand-300"
              )}
            >
              <span
                aria-hidden
                className="h-5 w-5 shrink-0 rounded-full border border-slate-200"
                style={{ backgroundColor: palettePreviewColor[option] }}
              />
              <span>{labels[option]}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UiSettings | null>(null);
  const [palettes, setPalettes] = useState<Palette[]>(["blue", "emerald", "amber", "violet", "navy", "jade"]);
  const [modes, setModes] = useState<Mode[]>(["light", "dark"]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const response = await apiFetch<SettingsResponse>("/api/admin/settings");
        if (!canceled) {
          setSettings(response.settings);
          setPalettes(response.palettes);
          setModes(response.modes);
          setError(null);
        }
      } catch (err) {
        if (!canceled) {
          const message = err instanceof ApiError ? err.message : "Einstellungen konnten nicht geladen werden";
          setError(message);
        }
      }
    }

    load();

    return () => {
      canceled = true;
    };
  }, []);

  async function save() {
    if (!settings) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch<{ settings: UiSettings }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings)
      });
      setSettings(response.settings);
      setSuccess("Einstellungen gespeichert. Änderungen sind sofort aktiv.");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Speichern fehlgeschlagen";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <Card className="p-4 text-sm text-slate-600">Lade Einstellungen...</Card>;
  }

  return (
    <section className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-slate-900">Theme-Einstellungen</h2>
        <p className="text-sm text-slate-600">Hier konfigurierst du Farbpalette und Light/Dark Mode getrennt für Kiosk und Admin.</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-4">
          <h3 className="text-base font-semibold text-slate-900">Kiosk</h3>
          <PaletteField label="Farbpalette" value={settings.kioskPalette} options={palettes} labels={paletteLabel} onChange={(value) => setSettings((prev) => (prev ? { ...prev, kioskPalette: value } : prev))} />
          <SelectField label="Modus" value={settings.kioskMode} options={modes} labels={modeLabel} onChange={(value) => setSettings((prev) => (prev ? { ...prev, kioskMode: value } : prev))} />
        </Card>

        <Card className="space-y-4 p-4">
          <h3 className="text-base font-semibold text-slate-900">Admin</h3>
          <PaletteField label="Farbpalette" value={settings.adminPalette} options={palettes} labels={paletteLabel} onChange={(value) => setSettings((prev) => (prev ? { ...prev, adminPalette: value } : prev))} />
          <SelectField label="Modus" value={settings.adminMode} options={modes} labels={modeLabel} onChange={(value) => setSettings((prev) => (prev ? { ...prev, adminMode: value } : prev))} />
        </Card>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

      <div>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Speichere..." : "Einstellungen speichern"}
        </Button>
      </div>
    </section>
  );
}
