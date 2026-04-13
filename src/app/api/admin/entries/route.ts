import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/admin-guard";
import { listEntriesForAdmin } from "@/server/services";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.response) {
    return auth.response;
  }

  const month = request.nextUrl.searchParams.get("month") ?? undefined;
  const entries = await listEntriesForAdmin(prisma, month);

  return ok({ entries });
}
