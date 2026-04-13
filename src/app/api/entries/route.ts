import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { submitEntrySchema } from "@/server/schemas";
import { createEntry, listEntriesForDate, listEntriesForMonth } from "@/server/services";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");

  if (date) {
    const entries = await listEntriesForDate(prisma, date);
    return ok({ entries });
  }

  if (month) {
    const marked = await listEntriesForMonth(prisma, month);
    return ok(marked);
  }

  return fail("Parameter date oder month erforderlich", 400);
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = submitEntrySchema.safeParse(payload);

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ungültige Eingabe", 400);
  }

  try {
    const created = await createEntry(prisma, parsed.data, "kiosk");
    console.log("Entry created", created);
    return ok({ entry: created }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Speichern fehlgeschlagen";
    return fail(message, 400);
  }
}
