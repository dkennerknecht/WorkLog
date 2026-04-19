import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatDateGerman } from "@/lib/date";
import type { EntryDto } from "@/types/domain";

type DayEntriesPanelProps = {
  date: string | null;
  entries: EntryDto[];
  touchOptimized?: boolean;
};

export function DayEntriesPanel({ date, entries, touchOptimized = false }: DayEntriesPanelProps) {
  return (
    <Card className={cn("panel-strong h-full min-h-[320px] p-4", touchOptimized && "flex h-full min-h-0 flex-col overflow-hidden p-3 lg:p-4")}>
      <div className="flex items-center justify-between gap-3">
        <h3 className={cn("font-semibold text-slate-900", touchOptimized ? "text-4xl lg:text-5xl" : "text-lg")}>Einträge</h3>
        <p className={cn("text-slate-600", touchOptimized ? "text-xl font-semibold lg:text-2xl" : "text-sm")}>{date ? formatDateGerman(date) : "Bitte Datum wählen"}</p>
      </div>

      {entries.length === 0 ? (
        <p className={cn("mt-6 rounded-xl bg-slate-50 p-3 text-slate-600", touchOptimized ? "text-base" : "text-sm")}>Keine Einträge für diesen Tag.</p>
      ) : (
        <div className={cn("table-strong mt-3 overflow-x-auto rounded-xl border border-slate-200", touchOptimized && "min-h-0 flex-1 overflow-auto overscroll-contain")}>
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className={cn("sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700", touchOptimized ? "text-lg font-bold" : "text-sm")}>
                  Tätigkeiten
                </th>
                <th className={cn("sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700", touchOptimized ? "text-lg font-bold" : "text-sm")}>
                  Personen
                </th>
                <th className={cn("sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700", touchOptimized ? "text-lg font-bold" : "text-sm")}>
                  Orte
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-b-0">
                  <td className={cn("px-4 py-3 align-top text-slate-600", touchOptimized ? "text-lg font-medium" : "text-sm")}>{entry.tasks.map((item) => item.name).join(", ") || "-"}</td>
                  <td className={cn("px-4 py-3 align-top text-slate-600", touchOptimized ? "text-lg font-medium" : "text-sm")}>{entry.people.map((item) => item.name).join(", ") || "-"}</td>
                  <td className={cn("px-4 py-3 align-top text-slate-600", touchOptimized ? "text-lg font-medium" : "text-sm")}>{entry.locations.map((item) => item.name).join(", ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
