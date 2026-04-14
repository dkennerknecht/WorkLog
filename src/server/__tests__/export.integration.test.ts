import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildExportPreview, listExportMappingControl, listExportOptions, upsertExportTemplate } from "@/server/export";
import { createEntry } from "@/server/services";

const prisma = new PrismaClient();

let taskAId = "";
let taskBId = "";
let personAId = "";
let personBId = "";
let personCId = "";
let kappelenwegLocationId = "";
let createdKappelenwegLocationId: string | null = null;
const createdEntryIds: string[] = [];

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  createdEntryIds.length = 0;
  createdKappelenwegLocationId = null;
  const suffix = crypto.randomUUID().slice(0, 8);

  const [taskA, taskB, personA, personB, personC] = await Promise.all([
    prisma.task.create({ data: { name: `TEST-STREUEN-${suffix}`, isActive: true, sortOrder: 1 } }),
    prisma.task.create({ data: { name: `TEST-RAEUMEN-${suffix}`, isActive: true, sortOrder: 2 } }),
    prisma.person.create({ data: { name: `TEST-PERSON-A-${suffix}`, isActive: true } }),
    prisma.person.create({ data: { name: `TEST-PERSON-B-${suffix}`, isActive: true } }),
    prisma.person.create({ data: { name: `TEST-PERSON-C-${suffix}`, isActive: true } })
  ]);

  const locations = await prisma.location.findMany({ select: { id: true, name: true } });
  const existingKappelenweg = locations.find((location) => {
    const normalized = location.name.toLowerCase().replace(/\s+/g, "");
    return normalized.includes("kappelenweg") || normalized.includes("kapellenweg");
  });

  if (existingKappelenweg) {
    kappelenwegLocationId = existingKappelenweg.id;
  } else {
    const createdLocation = await prisma.location.create({ data: { name: `Kappelenweg ${suffix}`, isActive: true, sortOrder: 1 } });
    kappelenwegLocationId = createdLocation.id;
    createdKappelenwegLocationId = createdLocation.id;
  }

  taskAId = taskA.id;
  taskBId = taskB.id;
  personAId = personA.id;
  personBId = personB.id;
  personCId = personC.id;

  const entryOne = await createEntry(
    prisma,
    {
      date: "2026-04-12",
      taskIds: [taskAId],
      personIds: [personAId],
      locationIds: [kappelenwegLocationId]
    },
    "tester"
  );

  const entryTwo = await createEntry(
    prisma,
    {
      date: "2026-04-12",
      taskIds: [taskAId],
      personIds: [personAId, personBId],
      locationIds: [kappelenwegLocationId]
    },
    "tester"
  );

  const entryThree = await createEntry(
    prisma,
    {
      date: "2026-04-12",
      taskIds: [taskAId, taskBId],
      personIds: [personAId, personBId, personCId],
      locationIds: [kappelenwegLocationId]
    },
    "tester"
  );

  createdEntryIds.push(entryOne.id, entryTwo.id, entryThree.id);
});

afterEach(async () => {
  if (createdEntryIds.length > 0) {
    await prisma.entry.deleteMany({ where: { id: { in: createdEntryIds } } });
  }

  await prisma.exportTemplate.deleteMany({ where: { taskId: { in: [taskAId, taskBId] } } });
  await prisma.task.deleteMany({ where: { id: { in: [taskAId, taskBId] } } });
  await prisma.person.deleteMany({ where: { id: { in: [personAId, personBId, personCId] } } });
  if (createdKappelenwegLocationId) {
    await prisma.location.deleteMany({ where: { id: createdKappelenwegLocationId } });
  }
});

function templatePayload(exportLocationKey: string, taskId: string, number: string, productName: string) {
  return {
    exportLocationKey,
    taskId,
    number,
    productName,
    price: "0",
    discount: "0",
    uvp: "",
    unit: "wu",
    type: "work",
    vatRateId: "",
    workHours: "",
    groupSku: "",
    groupName: "",
    groupIndex: "",
    productId: "",
    groupId: ""
  };
}

describe("export integration", () => {
  it("blocks export when mapping is missing", async () => {
    const options = await listExportOptions(prisma);
    const locationKey = "virtual:kappellenweg";

    await upsertExportTemplate(prisma, templatePayload(locationKey, taskAId, "HAUS 011", "Streuen Artikel"));

    const preview = await buildExportPreview(prisma, { month: "2026-04", exportLocationKey: locationKey });

    expect(preview.canCopy).toBe(false);
    expect(preview.clipboardText).toBeNull();
    expect(preview.missingMappings).toHaveLength(1);
    expect(preview.missingMappings[0]?.taskId).toBe(taskBId);
    expect(options.exportLocations.some((location) => location.key === "virtual:altersheim")).toBe(true);
    expect(options.exportLocations.some((location) => location.key === "virtual:kappellenweg")).toBe(true);
    expect(options.exportLocations.some((location) => location.key === `loc:${kappelenwegLocationId}`)).toBe(false);
  });

  it("aggregates quantity per day and task and creates clipboard output", async () => {
    const locationKey = "virtual:kappellenweg";

    await Promise.all([
      upsertExportTemplate(prisma, templatePayload(locationKey, taskAId, "HAUS 011", "Streuen Artikel")),
      upsertExportTemplate(prisma, templatePayload(locationKey, taskBId, "HAUS 012", "Raeumen Artikel"))
    ]);

    const preview = await buildExportPreview(prisma, { month: "2026-04", exportLocationKey: locationKey });

    expect(preview.canCopy).toBe(true);
    expect(preview.missingMappings).toHaveLength(0);
    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]?.quantity).toBe(6);
    expect(preview.rows[0]?.description).toBe("12.04.2026 - 6 Personen");
    expect(preview.rows[0]?.number).toBe("HAUS 011");
    expect(preview.rows[1]?.quantity).toBe(3);
    expect(preview.rows[1]?.number).toBe("HAUS 012");
    expect(preview.clipboardText).toContain("number;quantity;productName;description;price;discount;uvp;unit;type;vatRateId;workHours;groupSku;groupName;groupIndex;productId;groupId");
    expect(preview.clipboardText).toContain("HAUS 011;6;Streuen Artikel;12.04.2026 - 6 Personen;0;0;");
  });

  it("uses Kappelenweg data for virtual Altersheim export", async () => {
    const virtualLocationKey = "virtual:altersheim";

    await Promise.all([
      upsertExportTemplate(prisma, templatePayload(virtualLocationKey, taskAId, "ALT 011", "Altersheim Streuen")),
      upsertExportTemplate(prisma, templatePayload(virtualLocationKey, taskBId, "ALT 012", "Altersheim Raeumen"))
    ]);

    const preview = await buildExportPreview(prisma, { month: "2026-04", exportLocationKey: virtualLocationKey });

    expect(preview.canCopy).toBe(true);
    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]?.quantity).toBe(6);
    expect(preview.rows[1]?.quantity).toBe(3);
    expect(preview.rows[0]?.number).toBe("ALT 011");
    expect(preview.rows[1]?.number).toBe("ALT 012");
  });

  it("returns mapping-control overview with existing mappings", async () => {
    const locationKey = "virtual:kappellenweg";

    await upsertExportTemplate(prisma, templatePayload(locationKey, taskAId, "HAUS 011", "Streuen Artikel"));

    const control = await listExportMappingControl(prisma);
    const mapping = control.mappings.find((row) => row.exportLocationKey === locationKey && row.taskId === taskAId);

    expect(control.exportLocations.some((location) => location.key === "virtual:altersheim")).toBe(true);
    expect(control.exportLocations.some((location) => location.key === "virtual:kappellenweg")).toBe(true);
    expect(control.tasks.some((task) => task.id === taskAId)).toBe(true);
    expect(mapping?.number).toBe("HAUS 011");
  });
});
