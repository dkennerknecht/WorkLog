import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

type StepLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  navigation?: ReactNode;
  kiosk?: boolean;
};

export function StepLayout({ title, description, children, navigation, kiosk = false }: StepLayoutProps) {
  return (
    <Card className={cn("mx-auto w-full p-5 sm:p-6", kiosk ? "flex h-full min-h-0 max-w-none flex-col p-4 lg:p-5" : "max-w-4xl")}>
      <div className={cn("mb-4", kiosk && "mb-3")}>
        <h1 className={cn("font-semibold text-slate-900", kiosk ? "text-3xl lg:text-4xl" : "text-2xl")}>{title}</h1>
        {description ? <p className={cn("mt-1 text-slate-600", kiosk ? "text-lg" : "text-sm")}>{description}</p> : null}
      </div>
      <div className={cn(kiosk ? "min-h-0 flex-1" : "")}>{children}</div>
      {navigation ? <div className={cn(kiosk ? "mt-3 border-t border-slate-200 pt-3" : "")}>{navigation}</div> : null}
    </Card>
  );
}
