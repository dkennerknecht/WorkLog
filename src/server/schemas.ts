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

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});
