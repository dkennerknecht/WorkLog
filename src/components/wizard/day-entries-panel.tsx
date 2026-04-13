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
    <Card className={cn("panel-strong h-full min-h-[320px] p-4", touchOptimized && "min-h-[420px] p-4 lg:min-h-[500px] lg:p-5 xl:min-h-[620px] xl:p-6")}>
      <h3 className={cn("font-semibold text-slate-900", touchOptimized ? "text-2xl" : "text-lg")}>Einträge</h3>
      <p className={cn("text-slate-600", touchOptimized ? "text-base" : "text-sm")}>{date ? formatDateGerman(date) : "Bitte Datum wählen"}</p>

      {entries.length === 0 ? (
        <p className={cn("mt-6 rounded-xl bg-slate-50 p-3 text-slate-600", touchOptimized ? "text-base" : "text-sm")}>Keine Einträge für diesen Tag.</p>
      ) : (
        <div className={cn("table-strong mt-4 overflow-x-auto rounded-xl border border-slate-200", touchOptimized && "max-h-[360px] overflow-auto lg:max-h-[400px] xl:max-h-[520px]")}>
          <table className="w-full min-w-[700px] border-collapse">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className={cn("px-4 py-3 text-left font-semibold text-slate-700", touchOptimized ? "text-lg" : "text-sm")}>Tätigkeiten</th>
                <th className={cn("px-4 py-3 text-left font-semibold text-slate-700", touchOptimized ? "text-lg" : "text-sm")}>Personen</th>
                <th className={cn("px-4 py-3 text-left font-semibold text-slate-700", touchOptimized ? "text-lg" : "text-sm")}>Orte</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-b-0">
                  <td className={cn("px-4 py-3 align-top text-slate-600", touchOptimized ? "text-lg" : "text-sm")}>{entry.tasks.map((item) => item.name).join(", ") || "-"}</td>
                  <td className={cn("px-4 py-3 align-top text-slate-600", touchOptimized ? "text-lg" : "text-sm")}>{entry.people.map((item) => item.name).join(", ") || "-"}</td>
                  <td className={cn("px-4 py-3 align-top text-slate-600", touchOptimized ? "text-lg" : "text-sm")}>{entry.locations.map((item) => item.name).join(", ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
