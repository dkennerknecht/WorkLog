import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createEntry, createMasterRecord, listEntriesForDate, listEntriesForMonth, updateEntry } from "@/server/services";

const prisma = new PrismaClient();

let taskId = "";
let personId = "";
let locationId = "";
const createdEntryIds: string[] = [];

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  createdEntryIds.length = 0;
  const suffix = crypto.randomUUID().slice(0, 8);

  const [task, person, location] = await Promise.all([
    prisma.task.create({ data: { name: `TEST-TASK-${suffix}`, isActive: true } }),
    prisma.person.create({ data: { name: `TEST-PERSON-${suffix}`, isActive: true } }),
    prisma.location.create({ data: { name: `TEST-LOCATION-${suffix}`, isActive: true } })
  ]);

  taskId = task.id;
  personId = person.id;
  locationId = location.id;
});

afterEach(async () => {
  if (createdEntryIds.length > 0) {
    await prisma.entry.deleteMany({
      where: {
        id: { in: createdEntryIds }
      }
    });
  }

  await prisma.task.delete({ where: { id: taskId } });
  await prisma.person.delete({ where: { id: personId } });
  await prisma.location.delete({ where: { id: locationId } });
});

describe("entry services integration", () => {
  it("creates entry and returns for date/month queries", async () => {
    const created = await createEntry(
      prisma,
      {
        date: "2026-04-10",
        taskIds: [taskId],
        personIds: [personId],
        locationIds: [locationId]
      },
      "tester"
    );

    createdEntryIds.push(created.id);
    expect(created.version).toBe(1);

    const dayEntries = await listEntriesForDate(prisma, "2026-04-10");
    expect(dayEntries).toHaveLength(1);

    const monthEntries = await listEntriesForMonth(prisma, "2026-04");
    expect(monthEntries.dates).toContain("2026-04-10");
  });

  it("creates a new version when updating", async () => {
    const created = await createEntry(
      prisma,
      {
        date: "2026-04-10",
        taskIds: [taskId],
        personIds: [personId],
        locationIds: [locationId]
      },
      "tester"
    );

    createdEntryIds.push(created.id);
    const updated = await updateEntry(
      prisma,
      created.id,
      {
        date: "2026-04-10",
        taskIds: [taskId],
        personIds: [personId],
        locationIds: [locationId],
        changeNote: "korrigiert"
      },
      "admin"
    );

    expect(updated.version).toBe(2);
    expect(updated.changeNote).toBe("korrigiert");
  });

  it("rejects creating an already active master record with clear message", async () => {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    expect(existing).not.toBeNull();
    await expect(createMasterRecord(prisma, "task", existing!.name)).rejects.toThrow(/existiert bereits/i);
  });

  it("reactivates deactivated master record instead of creating duplicate", async () => {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    expect(existing).not.toBeNull();

    await prisma.task.update({
      where: { id: taskId },
      data: { isActive: false, deactivatedAt: new Date() }
    });

    const reactivated = await createMasterRecord(prisma, "task", existing!.name);
    expect(reactivated.id).toBe(taskId);
    expect(reactivated.isActive).toBe(true);
    expect(reactivated.deactivatedAt).toBeNull();
  });
});
