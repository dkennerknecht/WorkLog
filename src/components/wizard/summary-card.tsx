import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type SummaryCardProps = {
  title: string;
  items: string[];
  touchOptimized?: boolean;
};

export function SummaryCard({ title, items, touchOptimized = false }: SummaryCardProps) {
  return (
    <Card className={cn("p-4", touchOptimized && "p-6")}>
      <h3 className={cn("font-semibold text-slate-700", touchOptimized ? "text-xl" : "text-sm")}>{title}</h3>
      <ul className={cn("mt-2 flex flex-wrap gap-2", touchOptimized && "gap-3")}>
        {items.map((item) => (
          <li key={item} className={cn("rounded-lg bg-slate-100 px-3 py-1 text-slate-700", touchOptimized ? "px-5 py-2.5 text-lg" : "text-sm")}>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
