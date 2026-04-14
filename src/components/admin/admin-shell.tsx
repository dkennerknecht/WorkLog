"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function AdminShell({ username, children }: { username: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">WorkLog Admin</h1>
            <p className="text-xs text-slate-500">Angemeldet als {username}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={pathname.startsWith("/admin/settings") ? "secondary" : "ghost"}
              onClick={() => router.push("/admin/settings")}
            >
              Einstellungen
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/kiosk")}>
              Kiosk
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await fetch("/api/admin/auth/logout", { method: "POST" });
                router.replace("/admin/login");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-4 sm:px-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-2">
          <nav className="space-y-1">
            <Link href="/admin/masterdata" className={cn("block rounded-lg px-3 py-2 text-sm", pathname.startsWith("/admin/masterdata") ? "state-selected text-slate-900" : "text-slate-700 hover:bg-slate-100")}>
              Stammdaten
            </Link>
            <Link href="/admin/entries" className={cn("block rounded-lg px-3 py-2 text-sm", pathname.startsWith("/admin/entries") ? "state-selected text-slate-900" : "text-slate-700 hover:bg-slate-100")}>
              Einträge
            </Link>
            <Link href="/admin/export" className={cn("block rounded-lg px-3 py-2 text-sm", pathname.startsWith("/admin/export") && !pathname.startsWith("/admin/export-mapping") ? "state-selected text-slate-900" : "text-slate-700 hover:bg-slate-100")}>
              Export
            </Link>
            <Link
              href="/admin/export-mapping"
              className={cn(
                "block rounded-lg px-3 py-2 text-sm",
                pathname.startsWith("/admin/export-mapping") && !pathname.startsWith("/admin/export-mapping-control")
                  ? "state-selected text-slate-900"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              Export-Mapping
            </Link>
            <Link
              href="/admin/export-mapping-control"
              className={cn(
                "block rounded-lg px-3 py-2 text-sm",
                pathname.startsWith("/admin/export-mapping-control") ? "state-selected text-slate-900" : "text-slate-700 hover:bg-slate-100"
              )}
            >
              Mapping-Kontrolle
            </Link>
            <Link href="/admin/settings" className={cn("block rounded-lg px-3 py-2 text-sm", pathname.startsWith("/admin/settings") ? "state-selected text-slate-900" : "text-slate-700 hover:bg-slate-100")}>
              Einstellungen
            </Link>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
