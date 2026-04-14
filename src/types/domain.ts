export type OptionItem = {
  id: string;
  name: string;
  isActive: boolean;
};

export type SnapshotItem = {
  id: string;
  name: string;
};

export type EntryDto = {
  id: string;
  entryDate: string;
  createdAt: string;
  createdBy: string | null;
  version: number;
  changedAt: string;
  changedBy: string | null;
  changeNote: string | null;
  tasks: SnapshotItem[];
  people: SnapshotItem[];
  locations: SnapshotItem[];
};

export type EntryVersionDto = {
  id: string;
  version: number;
  isCurrent: boolean;
  changedAt: string;
  changedBy: string | null;
  changeNote: string | null;
  tasks: SnapshotItem[];
  people: SnapshotItem[];
  locations: SnapshotItem[];
};

export type OptionsResponse = {
  tasks: OptionItem[];
  people: OptionItem[];
  locations: OptionItem[];
};

export type ExportLocationOption = {
  key: string;
  name: string;
  sourceLocationId: string | null;
  sourceLocationName: string | null;
  isVirtual: boolean;
};

export type ExportTemplateDto = {
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
  createdAt: string;
  updatedAt: string;
};

export type ExportPreviewRowDto = {
  date: string;
  taskId: string;
  taskName: string;
  quantity: number;
  description: string;
  number: string;
};

export type ExportPreviewResponse = {
  month: string;
  exportLocationKey: string;
  exportLocationName: string;
  rows: ExportPreviewRowDto[];
  missingMappings: Array<{ taskId: string; taskName: string }>;
  canCopy: boolean;
  clipboardText: string | null;
};

export type ExportMappingCellDto = {
  exportLocationKey: string;
  taskId: string;
  number: string;
  productName: string;
  updatedAt: string;
};

export type ExportMappingControlResponse = {
  exportLocations: ExportLocationOption[];
  tasks: OptionItem[];
  mappings: ExportMappingCellDto[];
};
