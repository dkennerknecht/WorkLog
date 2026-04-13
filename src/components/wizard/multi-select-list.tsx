"use client";

import { cn } from "@/lib/cn";
import type { OptionItem } from "@/types/domain";
import { Badge } from "@/components/ui/badge";

type MultiSelectListProps = {
  items: OptionItem[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowInactive?: boolean;
  touchOptimized?: boolean;
};

export function MultiSelectList({ items, selected, onChange, allowInactive = false, touchOptimized = false }: MultiSelectListProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    onChange([...selected, id]);
  };

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", touchOptimized && "gap-4 lg:grid-cols-3")}>
      {items.map((item) => {
        const isActive = item.isActive || allowInactive;
        const checked = selected.includes(item.id);

        return (
          <button
            key={item.id}
            type="button"
            disabled={!isActive}
            onClick={() => toggle(item.id)}
            className={cn(
              "kiosk-choice flex min-h-14 items-center justify-between rounded-xl border px-4 text-left transition",
              touchOptimized && "min-h-20 rounded-2xl px-5",
              checked ? "state-selected" : "border-slate-200 bg-white hover:border-brand-300",
              !isActive && "cursor-not-allowed opacity-50"
            )}
          >
            <span className={cn("font-medium text-slate-900", touchOptimized ? "text-xl" : "text-base")}>{item.name}</span>
            {!item.isActive ? <Badge tone="muted">deaktiviert</Badge> : null}
          </button>
        );
      })}
    </div>
  );
}
