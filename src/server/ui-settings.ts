import { prisma } from "@/lib/prisma";

export const PALETTES = ["blue", "emerald", "amber", "violet", "navy", "jade"] as const;
export const MODES = ["light", "dark"] as const;

export type Palette = (typeof PALETTES)[number];
export type Mode = (typeof MODES)[number];

export type UiSettingsDto = {
  kioskPalette: Palette;
  kioskMode: Mode;
  adminPalette: Palette;
  adminMode: Mode;
};

const defaultSettings: UiSettingsDto = {
  kioskPalette: "blue",
  kioskMode: "light",
  adminPalette: "blue",
  adminMode: "light"
};

function normalizePalette(value: string): Palette {
  if ((PALETTES as readonly string[]).includes(value)) {
    return value as Palette;
  }
  return defaultSettings.kioskPalette;
}

function normalizeMode(value: string): Mode {
  if ((MODES as readonly string[]).includes(value)) {
    return value as Mode;
  }
  return defaultSettings.kioskMode;
}

function mapSettings(record: {
  kioskPalette: string;
  kioskMode: string;
  adminPalette: string;
  adminMode: string;
}): UiSettingsDto {
  return {
    kioskPalette: normalizePalette(record.kioskPalette),
    kioskMode: normalizeMode(record.kioskMode),
    adminPalette: normalizePalette(record.adminPalette),
    adminMode: normalizeMode(record.adminMode)
  };
}

export async function getUiSettings(): Promise<UiSettingsDto> {
  const record = await prisma.uiSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ...defaultSettings }
  });

  return mapSettings(record);
}

export async function updateUiSettings(payload: Partial<UiSettingsDto>): Promise<UiSettingsDto> {
  const current = await getUiSettings();

  const next = {
    kioskPalette: payload.kioskPalette ?? current.kioskPalette,
    kioskMode: payload.kioskMode ?? current.kioskMode,
    adminPalette: payload.adminPalette ?? current.adminPalette,
    adminMode: payload.adminMode ?? current.adminMode
  };

  const saved = await prisma.uiSetting.upsert({
    where: { id: 1 },
    update: next,
    create: { id: 1, ...next }
  });

  return mapSettings(saved);
}

export function toThemeScopeClasses(palette: Palette, mode: Mode): string {
  return `theme-scope palette-${palette} mode-${mode}`;
}
