import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { listActiveOptions } from "@/server/services";

export async function GET() {
  const options = await listActiveOptions(prisma);
  return ok(options);
}
