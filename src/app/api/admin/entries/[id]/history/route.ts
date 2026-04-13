import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/admin-guard";
import { listEntryHistory } from "@/server/services";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;
  const versions = await listEntryHistory(prisma, id);

  if (versions.length === 0) {
    return fail("Keine Versionen gefunden", 404);
  }

  return ok({ versions });
}
