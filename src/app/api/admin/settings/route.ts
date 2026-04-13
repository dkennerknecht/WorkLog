import type { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/http";
import { requireAdmin } from "@/server/admin-guard";
import { MODES, PALETTES, getUiSettings, updateUiSettings } from "@/server/ui-settings";

const settingsPatchSchema = z
  .object({
    kioskPalette: z.enum(PALETTES).optional(),
    kioskMode: z.enum(MODES).optional(),
    adminPalette: z.enum(PALETTES).optional(),
    adminMode: z.enum(MODES).optional()
  })
  .refine((value) => Object.keys(value).length > 0, "Mindestens ein Feld muss gesetzt sein.");

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const settings = await getUiSettings();
  return ok({ settings, palettes: PALETTES, modes: MODES });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = settingsPatchSchema.safeParse(payload);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe", 400);
  }

  const settings = await updateUiSettings(parsed.data);
  return ok({ settings });
}
