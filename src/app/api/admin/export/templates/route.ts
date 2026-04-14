import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/admin-guard";
import { listExportTemplatesByLocation, upsertExportTemplate } from "@/server/export";
import { exportTemplateUpsertSchema } from "@/server/schemas";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const exportLocationKey = request.nextUrl.searchParams.get("exportLocationKey")?.trim();
  if (!exportLocationKey) {
    return fail("exportLocationKey ist erforderlich.", 400);
  }

  const templates = await listExportTemplatesByLocation(prisma, exportLocationKey);
  return ok({ exportLocationKey, templates });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = exportTemplateUpsertSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe", 400);
  }

  try {
    const template = await upsertExportTemplate(prisma, parsed.data);
    return ok({ template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Template konnte nicht gespeichert werden.";
    return fail(message, 400);
  }
}

