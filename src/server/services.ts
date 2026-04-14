import type { PrismaClient } from "@prisma/client";
import { endOfMonth, parseISO, startOfDay, startOfMonth } from "date-fns";
import type { EntryDto, EntryVersionDto, OptionItem, SnapshotItem } from "@/types/domain";
import { toDateString } from "@/lib/date";
import { toSnapshotItems } from "@/server/snapshots";

export type PrismaLike = PrismaClient;
type MasterRecordType = "task" | "person" | "location";

function mapEntryWithVersion(entry: {
  id: string;
  entryDate: Date;
  createdAt: Date;
  createdBy: string | null;
  versions: {
    version: number;
    changedAt: Date;
    changedBy: string | null;
    changeNote: string | null;
    tasksJson: unknown;
    peopleJson: unknown;
    locationsJson: unknown;
  }[];
}): EntryDto {
  const current = entry.versions[0];

  return {
    id: entry.id,
    entryDate: toDateString(entry.entryDate),
    createdAt: entry.createdAt.toISOString(),
    createdBy: entry.createdBy,
    version: current.version,
    changedAt: current.changedAt.toISOString(),
    changedBy: current.changedBy,
    changeNote: current.changeNote,
    tasks: toSnapshotItems(current.tasksJson as never),
    people: toSnapshotItems(current.peopleJson as never),
    locations: toSnapshotItems(current.locationsJson as never)
  };
}

async function loadSnapshots(db: PrismaLike, payload: { taskIds: string[]; personIds: string[]; locationIds: string[] }, includeInactive = false) {
  const [tasks, people, locations] = await Promise.all([
    db.task.findMany({ where: { id: { in: payload.taskIds }, ...(includeInactive ? {} : { isActive: true }) } }),
    db.person.findMany({ where: { id: { in: payload.personIds }, ...(includeInactive ? {} : { isActive: true }) } }),
    db.location.findMany({ where: { id: { in: payload.locationIds }, ...(includeInactive ? {} : { isActive: true }) } })
  ]);

  if (tasks.length !== payload.taskIds.length || people.length !== payload.personIds.length || locations.length !== payload.locationIds.length) {
    throw new Error("Mindestens eine Auswahl ist ungültig oder deaktiviert.");
  }

  const toSnapshot = (items: { id: string; name: string }[]): SnapshotItem[] => items.map((item) => ({ id: item.id, name: item.name }));

  return {
    tasks: toSnapshot(tasks),
    people: toSnapshot(people),
    locations: toSnapshot(locations)
  };
}

async function getNextSortOrder(db: PrismaLike, type: MasterRecordType): Promise<number> {
  if (type === "task") {
    const last = await db.task.findFirst({ orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }], select: { sortOrder: true } });
    return (last?.sortOrder ?? 0) + 1;
  }
  if (type === "person") {
    const last = await db.person.findFirst({ orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }], select: { sortOrder: true } });
    return (last?.sortOrder ?? 0) + 1;
  }

  const last = await db.location.findFirst({ orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }], select: { sortOrder: true } });
  return (last?.sortOrder ?? 0) + 1;
}

export async function listActiveOptions(db: PrismaLike) {
  const [tasks, people, locations] = await Promise.all([
    db.task.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.person.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.location.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  const map = (items: { id: string; name: string; isActive: boolean }[]): OptionItem[] =>
    items.map((item) => ({ id: item.id, name: item.name, isActive: item.isActive }));

  return {
    tasks: map(tasks),
    people: map(people),
    locations: map(locations)
  };
}

export async function listAllOptions(db: PrismaLike) {
  const [tasks, people, locations] = await Promise.all([
    db.task.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.person.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.location.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  const map = (items: { id: string; name: string; isActive: boolean }[]): OptionItem[] =>
    items.map((item) => ({ id: item.id, name: item.name, isActive: item.isActive }));

  return {
    tasks: map(tasks),
    people: map(people),
    locations: map(locations)
  };
}

export async function createEntry(
  db: PrismaLike,
  payload: {
    date: string;
    taskIds: string[];
    personIds: string[];
    locationIds: string[];
  },
  actor: string | null
): Promise<EntryDto> {
  const today = toDateString(new Date());
  if (payload.date > today) {
    throw new Error("Zukünftige Daten sind nicht erlaubt.");
  }

  const entryDate = startOfDay(parseISO(payload.date));
  const snapshots = await loadSnapshots(db, payload, false);

  const entry = await db.entry.create({
    data: {
      entryDate,
      createdBy: actor,
      versions: {
        create: {
          version: 1,
          isCurrent: true,
          tasksJson: snapshots.tasks,
          peopleJson: snapshots.people,
          locationsJson: snapshots.locations,
          changedBy: actor
        }
      }
    },
    include: {
      versions: {
        where: { isCurrent: true },
        take: 1,
        orderBy: { version: "desc" }
      }
    }
  });

  return mapEntryWithVersion(entry);
}

export async function updateEntry(
  db: PrismaLike,
  entryId: string,
  payload: {
    date: string;
    taskIds: string[];
    personIds: string[];
    locationIds: string[];
    changeNote?: string | null;
  },
  actor: string | null
): Promise<EntryDto> {
  const today = toDateString(new Date());
  if (payload.date > today) {
    throw new Error("Zukünftige Daten sind nicht erlaubt.");
  }

  const snapshots = await loadSnapshots(db, payload, true);
  const entryDate = startOfDay(parseISO(payload.date));

  return db.$transaction(async (tx) => {
    const current = await tx.entryVersion.findFirst({
      where: { entryId, isCurrent: true },
      orderBy: { version: "desc" }
    });

    if (!current) {
      throw new Error("Eintrag nicht gefunden.");
    }

    await tx.entryVersion.updateMany({ where: { entryId, isCurrent: true }, data: { isCurrent: false } });

    await tx.entry.update({
      where: { id: entryId },
      data: {
        entryDate
      }
    });

    await tx.entryVersion.create({
      data: {
        entryId,
        version: current.version + 1,
        isCurrent: true,
        tasksJson: snapshots.tasks,
        peopleJson: snapshots.people,
        locationsJson: snapshots.locations,
        changedBy: actor,
        changeNote: payload.changeNote?.trim() || null
      }
    });

    const reloaded = await tx.entry.findUnique({
      where: { id: entryId },
      include: {
        versions: {
          where: { isCurrent: true },
          orderBy: { version: "desc" },
          take: 1
        }
      }
    });

    if (!reloaded) {
      throw new Error("Eintrag nicht gefunden.");
    }

    return mapEntryWithVersion(reloaded);
  });
}

export async function getEntryById(db: PrismaLike, entryId: string): Promise<EntryDto | null> {
  const entry = await db.entry.findUnique({
    where: { id: entryId },
    include: {
      versions: {
        where: { isCurrent: true },
        orderBy: { version: "desc" },
        take: 1
      }
    }
  });

  if (!entry || entry.versions.length === 0) {
    return null;
  }

  return mapEntryWithVersion(entry);
}

export async function listEntryHistory(db: PrismaLike, entryId: string): Promise<EntryVersionDto[]> {
  const versions = await db.entryVersion.findMany({
    where: { entryId },
    orderBy: { version: "asc" }
  });

  return versions.map((version) => ({
    id: version.id,
    version: version.version,
    isCurrent: version.isCurrent,
    changedAt: version.changedAt.toISOString(),
    changedBy: version.changedBy,
    changeNote: version.changeNote,
    tasks: toSnapshotItems(version.tasksJson),
    people: toSnapshotItems(version.peopleJson),
    locations: toSnapshotItems(version.locationsJson)
  }));
}

export async function listEntriesForDate(db: PrismaLike, dateValue: string): Promise<EntryDto[]> {
  const date = startOfDay(parseISO(dateValue));
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const entries = await db.entry.findMany({
    where: {
      entryDate: {
        gte: date,
        lt: next
      }
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    include: {
      versions: {
        where: { isCurrent: true },
        orderBy: { version: "desc" },
        take: 1
      }
    }
  });

  return entries.filter((entry) => entry.versions.length > 0).map(mapEntryWithVersion);
}

export async function listEntriesForMonth(db: PrismaLike, monthValue: string): Promise<{ dates: string[] }> {
  const monthDate = parseISO(`${monthValue}-01`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const entries = await db.entry.findMany({
    where: {
      entryDate: {
        gte: start,
        lte: end
      }
    },
    select: {
      entryDate: true
    },
    distinct: ["entryDate"]
  });

  const uniqueDates = Array.from(new Set(entries.map((entry) => toDateString(entry.entryDate)))).sort();

  return { dates: uniqueDates };
}

export async function listEntriesForAdmin(db: PrismaLike, month?: string): Promise<EntryDto[]> {
  if (!month) {
    const entries = await db.entry.findMany({
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      include: {
        versions: {
          where: { isCurrent: true },
          orderBy: { version: "desc" },
          take: 1
        }
      },
      take: 200
    });

    return entries.filter((entry) => entry.versions.length > 0).map(mapEntryWithVersion);
  }

  const monthDate = parseISO(`${month}-01`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const entries = await db.entry.findMany({
    where: {
      entryDate: {
        gte: start,
        lte: end
      }
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    include: {
      versions: {
        where: { isCurrent: true },
        orderBy: { version: "desc" },
        take: 1
      }
    }
  });

  return entries.filter((entry) => entry.versions.length > 0).map(mapEntryWithVersion);
}

export async function createMasterRecord(db: PrismaLike, type: MasterRecordType, name: string) {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error("Name darf nicht leer sein.");
  }

  if (type === "task") {
    const existing = await db.task.findUnique({ where: { name: trimmedName } });
    if (existing) {
      if (existing.isActive) {
        throw new Error(`Tätigkeit "${trimmedName}" existiert bereits.`);
      }

      return db.task.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          deactivatedAt: null
        }
      });
    }

    const sortOrder = await getNextSortOrder(db, type);
    return db.task.create({ data: { name: trimmedName, isActive: true, sortOrder } });
  }

  if (type === "person") {
    const existing = await db.person.findUnique({ where: { name: trimmedName } });
    if (existing) {
      if (existing.isActive) {
        throw new Error(`Person "${trimmedName}" existiert bereits.`);
      }

      return db.person.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          deactivatedAt: null
        }
      });
    }

    const sortOrder = await getNextSortOrder(db, type);
    return db.person.create({ data: { name: trimmedName, isActive: true, sortOrder } });
  }

  const existing = await db.location.findUnique({ where: { name: trimmedName } });
  if (existing) {
    if (existing.isActive) {
      throw new Error(`Ort "${trimmedName}" existiert bereits.`);
    }

    return db.location.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        deactivatedAt: null
      }
    });
  }

  const sortOrder = await getNextSortOrder(db, type);
  return db.location.create({ data: { name: trimmedName, isActive: true, sortOrder } });
}

export async function updateMasterRecord(
  db: PrismaLike,
  type: MasterRecordType,
  id: string,
  payload: { name?: string; isActive?: boolean }
) {
  const data = {
    ...(payload.name ? { name: payload.name.trim() } : {}),
    ...(payload.isActive === undefined
      ? {}
      : {
          isActive: payload.isActive,
          deactivatedAt: payload.isActive ? null : new Date()
        })
  };

  if (type === "task") {
    return db.task.update({ where: { id }, data });
  }
  if (type === "person") {
    return db.person.update({ where: { id }, data });
  }
  return db.location.update({ where: { id }, data });
}

export async function reorderMasterRecords(db: PrismaLike, type: MasterRecordType, orderedIds: string[]) {
  const uniqueIds = Array.from(new Set(orderedIds));
  if (uniqueIds.length !== orderedIds.length) {
    throw new Error("Reihenfolge enthält doppelte Einträge.");
  }

  return db.$transaction(async (tx) => {
    if (type === "task") {
      const existing = await tx.task.findMany({ select: { id: true } });
      if (existing.length !== uniqueIds.length || existing.some((item) => !uniqueIds.includes(item.id))) {
        throw new Error("Reihenfolge stimmt nicht mit den vorhandenen Tätigkeiten überein.");
      }

      await Promise.all(uniqueIds.map((id, index) => tx.task.update({ where: { id }, data: { sortOrder: index + 1 } })));
      return;
    }

    if (type === "person") {
      const existing = await tx.person.findMany({ select: { id: true } });
      if (existing.length !== uniqueIds.length || existing.some((item) => !uniqueIds.includes(item.id))) {
        throw new Error("Reihenfolge stimmt nicht mit den vorhandenen Personen überein.");
      }

      await Promise.all(uniqueIds.map((id, index) => tx.person.update({ where: { id }, data: { sortOrder: index + 1 } })));
      return;
    }

    const existing = await tx.location.findMany({ select: { id: true } });
    if (existing.length !== uniqueIds.length || existing.some((item) => !uniqueIds.includes(item.id))) {
      throw new Error("Reihenfolge stimmt nicht mit den vorhandenen Orten überein.");
    }

    await Promise.all(uniqueIds.map((id, index) => tx.location.update({ where: { id }, data: { sortOrder: index + 1 } })));
  });
}
