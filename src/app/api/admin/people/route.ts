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

  const people = await prisma.person.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return ok({ items: people });
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
    const created = await createMasterRecord(prisma, "person", parsed.data.name);
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
    await reorderMasterRecords(prisma, "person", parsed.data.orderedIds);
    return ok({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sortierung fehlgeschlagen";
    return fail(message, 400);
  }
}
