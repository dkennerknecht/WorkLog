import { cn } from "@/lib/cn";
import { getUiSettings, toThemeScopeClasses } from "@/server/ui-settings";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getUiSettings();
  const themeClasses = toThemeScopeClasses(settings.adminPalette, settings.adminMode);

  return <div className={cn("min-h-screen readable-ui", themeClasses)}>{children}</div>;
}
