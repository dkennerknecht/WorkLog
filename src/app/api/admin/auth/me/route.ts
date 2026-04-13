import { fail, ok } from "@/lib/http";
import { getAdminFromServerCookies } from "@/server/auth";

export async function GET() {
  const admin = await getAdminFromServerCookies();
  if (!admin) {
    return fail("Nicht autorisiert", 401);
  }

  return ok({ user: { id: admin.id, username: admin.username } });
}
