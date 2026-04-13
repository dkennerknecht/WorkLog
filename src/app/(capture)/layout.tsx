import { cn } from "@/lib/cn";
import { WizardProvider } from "@/features/wizard/WizardProvider";
import { getUiSettings, toThemeScopeClasses } from "@/server/ui-settings";

export const dynamic = "force-dynamic";

export default async function CaptureLayout({ children }: { children: React.ReactNode }) {
  const settings = await getUiSettings();
  const themeClasses = toThemeScopeClasses(settings.kioskPalette, settings.kioskMode);

  return (
    <WizardProvider>
      <div className={cn("min-h-screen bg-slate-100 p-4 sm:p-6 readable-ui", themeClasses)}>{children}</div>
    </WizardProvider>
  );
}
