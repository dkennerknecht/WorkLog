import type { Prisma } from "@prisma/client";
import type { SnapshotItem } from "@/types/domain";

function isSnapshotArray(value: unknown): value is SnapshotItem[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "object" && item !== null && typeof item.id === "string" && typeof item.name === "string")
  );
}

export function toSnapshotItems(value: Prisma.JsonValue): SnapshotItem[] {
  if (isSnapshotArray(value)) {
    return value;
  }
  return [];
}
