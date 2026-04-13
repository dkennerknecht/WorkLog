import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/admin-guard";
import { masterCreateSchema, masterReorderSchema } from "@/server/schemas";
import { createMasterRecord, reorderMasterRecords } from "@/server/services";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const locations = await prisma.location.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return ok({ items: locations });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = masterCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe", 400);
  }

  try {
    const created = await createMasterRecord(prisma, "location", parsed.data.name);
    return ok({ item: created }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Speichern fehlgeschlagen";
    return fail(message, 400);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = masterReorderSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe", 400);
  }

  try {
    await reorderMasterRecords(prisma, "location", parsed.data.orderedIds);
    return ok({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sortierung fehlgeschlagen";
    return fail(message, 400);
  }
}
