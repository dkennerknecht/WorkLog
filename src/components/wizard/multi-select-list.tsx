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
  fillHeight?: boolean;
  className?: string;
  touchColumns?: 2 | 3;
};

export function MultiSelectList({
  items,
  selected,
  onChange,
  allowInactive = false,
  touchOptimized = false,
  fillHeight = false,
  className,
  touchColumns = 3
}: MultiSelectListProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    onChange([...selected, id]);
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2",
        touchOptimized && "gap-4",
        touchOptimized && (touchColumns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"),
        touchOptimized && fillHeight && "h-full min-h-0 auto-rows-fr content-stretch",
        className
      )}
    >
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
              touchOptimized && "h-full min-h-24 justify-center rounded-2xl px-6 py-4 text-center",
              checked ? "state-selected" : "border-slate-200 bg-white hover:border-brand-300",
              !isActive && "cursor-not-allowed opacity-50"
            )}
          >
            <span className={cn("font-medium text-slate-900", touchOptimized ? "w-full text-center text-3xl leading-tight" : "text-base")}>{item.name}</span>
            {!item.isActive ? <Badge tone="muted">deaktiviert</Badge> : null}
          </button>
        );
      })}
    </div>
  );
}
