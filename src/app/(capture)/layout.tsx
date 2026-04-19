import { cn } from "@/lib/cn";
import { WizardProvider } from "@/features/wizard/WizardProvider";
import { getUiSettings, toThemeScopeClasses } from "@/server/ui-settings";

export const dynamic = "force-dynamic";

export default async function CaptureLayout({ children }: { children: React.ReactNode }) {
  const settings = await getUiSettings();
  const themeClasses = toThemeScopeClasses(settings.kioskPalette, settings.kioskMode);

  return (
    <WizardProvider>
      <div className={cn("h-[100dvh] overflow-hidden bg-slate-100 p-2 sm:p-3 readable-ui", themeClasses)}>
        <div className="h-full min-h-0 w-full">{children}</div>
      </div>
    </WizardProvider>
  );
}
