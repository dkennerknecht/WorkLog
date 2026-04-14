import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/admin-guard";
import { listExportOptions } from "@/server/export";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const options = await listExportOptions(prisma);
  return ok(options);
}

