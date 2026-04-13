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
