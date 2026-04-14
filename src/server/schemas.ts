import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const submitEntrySchema = z.object({
  date: z.string().regex(dateRegex, "Ungültiges Datum"),
  taskIds: z.array(z.string().min(1)).min(1),
  personIds: z.array(z.string().min(1)).min(1),
  locationIds: z.array(z.string().min(1)).min(1)
});

export const updateEntrySchema = submitEntrySchema.extend({
  changeNote: z.string().trim().max(400).optional().nullable()
});

export const masterCreateSchema = z.object({
  name: z.string().trim().min(1).max(120)
});

export const masterUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  isActive: z.boolean().optional()
});

export const masterReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1)
});

const monthRegex = /^\d{4}-\d{2}$/;

const csvFieldSchema = z.string().trim().max(300);

export const exportPreviewSchema = z.object({
  month: z.string().regex(monthRegex, "Ungültiger Monat"),
  exportLocationKey: z.string().trim().min(1).max(120)
});

export const exportTemplateUpsertSchema = z.object({
  exportLocationKey: z.string().trim().min(1).max(120),
  taskId: z.string().trim().min(1),
  number: z.string().trim().min(1).max(120),
  productName: csvFieldSchema,
  price: csvFieldSchema,
  discount: csvFieldSchema,
  uvp: csvFieldSchema,
  unit: csvFieldSchema,
  type: csvFieldSchema,
  vatRateId: csvFieldSchema,
  workHours: csvFieldSchema,
  groupSku: csvFieldSchema,
  groupName: csvFieldSchema,
  groupIndex: csvFieldSchema,
  productId: csvFieldSchema,
  groupId: csvFieldSchema
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});
