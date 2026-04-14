import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/admin-guard";
import { buildExportPreview } from "@/server/export";
import { exportPreviewSchema } from "@/server/schemas";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const payload = await request.json().catch(() => null);
  const parsed = exportPreviewSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe", 400);
  }

  try {
    const preview = await buildExportPreview(prisma, parsed.data);
    return ok(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export-Vorschau fehlgeschlagen.";
    return fail(message, 400);
  }
}

