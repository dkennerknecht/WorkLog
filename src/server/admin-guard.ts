import type { NextRequest } from "next/server";
import { fail } from "@/lib/http";
import { getAdminFromRequest } from "@/server/auth";

export async function requireAdmin(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return { admin: null, response: fail("Nicht autorisiert", 401) };
  }

  return { admin, response: null };
}
