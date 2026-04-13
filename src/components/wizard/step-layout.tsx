import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

type StepLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  kiosk?: boolean;
};

export function StepLayout({ title, description, children, kiosk = false }: StepLayoutProps) {
  return (
    <Card className={cn("mx-auto w-full p-5 sm:p-6", kiosk ? "max-w-[1500px] p-6 lg:p-8" : "max-w-4xl")}>
      <div className={cn("mb-6", kiosk && "mb-8")}>
        <h1 className={cn("font-semibold text-slate-900", kiosk ? "text-3xl lg:text-4xl" : "text-2xl")}>{title}</h1>
        {description ? <p className={cn("mt-1 text-slate-600", kiosk ? "text-lg" : "text-sm")}>{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}
