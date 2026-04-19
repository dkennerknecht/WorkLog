import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type SummaryCardProps = {
  title: string;
  items: string[];
  touchOptimized?: boolean;
  compact?: boolean;
  fillHeight?: boolean;
};

export function SummaryCard({ title, items, touchOptimized = false, compact = false, fillHeight = false }: SummaryCardProps) {
  return (
    <Card className={cn("p-4", touchOptimized && (compact ? "p-3" : "p-5"), touchOptimized && fillHeight && "h-full")}>
      <h3 className={cn("font-semibold text-slate-700", touchOptimized ? (compact ? "text-lg" : "text-2xl") : "text-sm")}>{title}</h3>
      <ul className={cn("mt-2 flex flex-wrap gap-2", touchOptimized && (compact ? "gap-2" : "gap-3"))}>
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              "rounded-lg bg-slate-100 px-3 py-1 text-slate-700",
              touchOptimized ? (compact ? "px-4 py-1.5 text-base" : "px-5 py-2.5 text-xl") : "text-sm"
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
