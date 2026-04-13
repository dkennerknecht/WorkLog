import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/admin-guard";
import { updateEntrySchema } from "@/server/schemas";
import { getEntryById, updateEntry } from "@/server/services";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const entry = await getEntryById(prisma, id);

  if (!entry) {
    return fail("Eintrag nicht gefunden", 404);
  }

  return ok({ entry });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response || !auth.admin) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = updateEntrySchema.safeParse(payload);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe", 400);
  }

  const { id } = await context.params;

  try {
    const entry = await updateEntry(prisma, id, parsed.data, auth.admin.username);
    return ok({ entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen";
    return fail(message, 400);
  }
}
