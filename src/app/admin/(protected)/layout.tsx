import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminFromServerCookies } from "@/server/auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromServerCookies();
  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminShell username={admin.username}>{children}</AdminShell>;
}
