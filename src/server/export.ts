import { format, parseISO, subMonths } from "date-fns";
import type {
  OptionItem,
  ExportLocationOption,
  ExportMappingControlResponse,
  ExportPreviewResponse,
  ExportTemplateDto
} from "@/types/domain";
import type { PrismaLike } from "@/server/services";
import { listEntriesForAdmin } from "@/server/services";

const VIRTUAL_ALTERSHEIM_KEY = "virtual:altersheim";
const VIRTUAL_KAPPELLENWEG_KEY = "virtual:kappellenweg";
const EXPORT_HEADER = "number;quantity;productName;description;price;discount;uvp;unit;type;vatRateId;workHours;groupSku;groupName;groupIndex;productId;groupId";

function normalizeLocationName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function isKappelenwegName(value: string): boolean {
  const normalized = normalizeLocationName(value);
  return normalized.includes("kappelenweg") || normalized.includes("kapellenweg");
}

type TemplateFields = Omit<ExportTemplateDto, "id" | "taskId" | "exportLocationKey" | "createdAt" | "updatedAt">;

type ExportTemplateUpsertInput = {
  exportLocationKey: string;
  taskId: string;
} & TemplateFields;

function mapTemplate(record: {
  id: string;
  exportLocationKey: string;
  taskId: string;
  number: string;
  productName: string;
  price: string;
  discount: string;
  uvp: string;
  unit: string;
  type: string;
  vatRateId: string;
  workHours: string;
  groupSku: string;
  groupName: string;
  groupIndex: string;
  productId: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
}): ExportTemplateDto {
  return {
    id: record.id,
    exportLocationKey: record.exportLocationKey,
    taskId: record.taskId,
    number: record.number,
    productName: record.productName,
    price: record.price,
    discount: record.discount,
    uvp: record.uvp,
    unit: record.unit,
    type: record.type,
    vatRateId: record.vatRateId,
    workHours: record.workHours,
    groupSku: record.groupSku,
    groupName: record.groupName,
    groupIndex: record.groupIndex,
    productId: record.productId,
    groupId: record.groupId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function listExportOptions(db: PrismaLike): Promise<{
  defaultMonth: string;
  exportLocations: ExportLocationOption[];
  tasks: OptionItem[];
}> {
  const [locations, tasks] = await Promise.all([
    db.location.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.task.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  const kappelenweg = locations.find((location) => isKappelenwegName(location.name)) ?? null;
  const exportLocations: ExportLocationOption[] = locations
    .filter((location) => !isKappelenwegName(location.name))
    .map((location) => ({
      key: `loc:${location.id}`,
      name: location.name,
      sourceLocationId: location.id,
      sourceLocationName: location.name,
      isVirtual: false
    }));

  exportLocations.push({
    key: VIRTUAL_ALTERSHEIM_KEY,
    name: "Altersheim",
    sourceLocationId: kappelenweg?.id ?? null,
    sourceLocationName: kappelenweg?.name ?? null,
    isVirtual: true
  });
  exportLocations.push({
    key: VIRTUAL_KAPPELLENWEG_KEY,
    name: "Kappellenweg",
    sourceLocationId: kappelenweg?.id ?? null,
    sourceLocationName: kappelenweg?.name ?? null,
    isVirtual: true
  });

  return {
    defaultMonth: format(subMonths(new Date(), 1), "yyyy-MM"),
    exportLocations,
    tasks: tasks.map((task) => ({ id: task.id, name: task.name, isActive: task.isActive }))
  };
}

export async function listExportTemplatesByLocation(db: PrismaLike, exportLocationKey: string): Promise<ExportTemplateDto[]> {
  const templates = await db.exportTemplate.findMany({
    where: { exportLocationKey },
    orderBy: [{ task: { sortOrder: "asc" } }, { task: { name: "asc" } }]
  });

  return templates.map(mapTemplate);
}

export async function upsertExportTemplate(db: PrismaLike, input: ExportTemplateUpsertInput): Promise<ExportTemplateDto> {
  const template = await db.exportTemplate.upsert({
    where: {
      exportLocationKey_taskId: {
        exportLocationKey: input.exportLocationKey,
        taskId: input.taskId
      }
    },
    update: {
      number: input.number,
      productName: input.productName,
      price: input.price,
      discount: input.discount,
      uvp: input.uvp,
      unit: input.unit,
      type: input.type,
      vatRateId: input.vatRateId,
      workHours: input.workHours,
      groupSku: input.groupSku,
      groupName: input.groupName,
      groupIndex: input.groupIndex,
      productId: input.productId,
      groupId: input.groupId
    },
    create: {
      exportLocationKey: input.exportLocationKey,
      taskId: input.taskId,
      number: input.number,
      productName: input.productName,
      price: input.price,
      discount: input.discount,
      uvp: input.uvp,
      unit: input.unit,
      type: input.type,
      vatRateId: input.vatRateId,
      workHours: input.workHours,
      groupSku: input.groupSku,
      groupName: input.groupName,
      groupIndex: input.groupIndex,
      productId: input.productId,
      groupId: input.groupId
    }
  });

  return mapTemplate(template);
}

export async function listExportMappingControl(db: PrismaLike): Promise<ExportMappingControlResponse> {
  const { exportLocations, tasks } = await listExportOptions(db);
  const allowedLocationKeys = exportLocations.map((location) => location.key);

  const templates = await db.exportTemplate.findMany({
    where: { exportLocationKey: { in: allowedLocationKeys } },
    select: {
      exportLocationKey: true,
      taskId: true,
      number: true,
      productName: true,
      updatedAt: true
    }
  });

  return {
    exportLocations,
    tasks,
    mappings: templates.map((template) => ({
      exportLocationKey: template.exportLocationKey,
      taskId: template.taskId,
      number: template.number,
      productName: template.productName,
      updatedAt: template.updatedAt.toISOString()
    }))
  };
}

function toDescription(dateValue: string, quantity: number): string {
  return `${format(parseISO(dateValue), "dd.MM.yyyy")} - ${quantity} Personen`;
}

function toCopyDate(): string {
  return format(new Date(), "d.M.yyyy");
}

export async function buildExportPreview(
  db: PrismaLike,
  payload: { month: string; exportLocationKey: string }
): Promise<ExportPreviewResponse> {
  const { exportLocations, tasks } = await listExportOptions(db);
  const selectedLocation = exportLocations.find((location) => location.key === payload.exportLocationKey) ?? null;

  if (!selectedLocation) {
    throw new Error("Export-Ort ist ungültig.");
  }

  if (!selectedLocation.sourceLocationId) {
    throw new Error("Quell-Ort für den Export konnte nicht ermittelt werden.");
  }

  const [entries, templates] = await Promise.all([
    listEntriesForAdmin(db, payload.month),
    db.exportTemplate.findMany({
      where: { exportLocationKey: payload.exportLocationKey }
    })
  ]);

  const taskOrder = new Map(tasks.map((task, index) => [task.id, index]));
  const taskNameById = new Map(tasks.map((task) => [task.id, task.name]));
  const templateByTaskId = new Map(templates.map((template) => [template.taskId, template]));

  const aggregation = new Map<string, { date: string; taskId: string; taskName: string; quantity: number }>();

  for (const entry of entries) {
    if (!entry.locations.some((location) => location.id === selectedLocation.sourceLocationId)) {
      continue;
    }

    const peopleCount = entry.people.length;
    if (peopleCount === 0) {
      continue;
    }

    for (const task of entry.tasks) {
      const key = `${entry.entryDate}::${task.id}`;
      const current = aggregation.get(key);

      if (!current) {
        aggregation.set(key, {
          date: entry.entryDate,
          taskId: task.id,
          taskName: task.name,
          quantity: peopleCount
        });
        continue;
      }

      current.quantity += peopleCount;
    }
  }

  const rows = Array.from(aggregation.values()).sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    const aIndex = taskOrder.get(a.taskId) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = taskOrder.get(b.taskId) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return a.taskName.localeCompare(b.taskName);
  });

  const missingMappings = Array.from(
    new Map(
      rows
        .filter((row) => !templateByTaskId.has(row.taskId))
        .map((row) => [row.taskId, { taskId: row.taskId, taskName: row.taskName || taskNameById.get(row.taskId) || row.taskId }])
    ).values()
  );

  const previewRows = rows.map((row) => ({
    date: row.date,
    taskId: row.taskId,
    taskName: row.taskName,
    quantity: row.quantity,
    description: toDescription(row.date, row.quantity),
    number: templateByTaskId.get(row.taskId)?.number ?? ""
  }));

  const canCopy = missingMappings.length === 0;

  let clipboardText: string | null = null;
  if (canCopy) {
    const lines = [
      `ewkItems - easyWerkstatt - kopiert am ${toCopyDate()}`,
      EXPORT_HEADER,
      ...rows.map((row) => {
        const template = templateByTaskId.get(row.taskId);
        if (!template) {
          throw new Error("Template fehlt.");
        }

        return [
          template.number,
          String(row.quantity),
          template.productName || row.taskName,
          toDescription(row.date, row.quantity),
          template.price,
          template.discount,
          template.uvp,
          template.unit,
          template.type,
          template.vatRateId,
          template.workHours,
          template.groupSku,
          template.groupName,
          template.groupIndex,
          template.productId,
          template.groupId
        ].join(";");
      })
    ];

    clipboardText = lines.join("\n");
  }

  return {
    month: payload.month,
    exportLocationKey: payload.exportLocationKey,
    exportLocationName: selectedLocation.name,
    rows: previewRows,
    missingMappings,
    canCopy,
    clipboardText
  };
}
