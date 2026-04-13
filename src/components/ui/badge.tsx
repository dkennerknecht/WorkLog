import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "muted";
};

const tones = {
  neutral: "bg-brand-100 text-brand-700",
  success: "bg-emerald-100 text-emerald-700",
  muted: "bg-slate-100 text-slate-600"
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)} {...props} />;
}
