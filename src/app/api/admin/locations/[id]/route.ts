import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/admin-guard";
import { masterUpdateSchema } from "@/server/schemas";
import { updateMasterRecord } from "@/server/services";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = masterUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe", 400);
  }

  const { id } = await context.params;

  try {
    const updated = await updateMasterRecord(prisma, "location", id, parsed.data);
    return ok({ item: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Aktualisierung fehlgeschlagen";
    return fail(message, 400);
  }
}
