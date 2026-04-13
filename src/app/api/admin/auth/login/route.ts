import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { createAdminSession, getSessionCookieOptions, verifyAdminCredentials } from "@/server/auth";
import { loginSchema } from "@/server/schemas";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("Ungültige Zugangsdaten", 400);
  }

  const admin = await verifyAdminCredentials(parsed.data.username, parsed.data.password);
  if (!admin) {
    return fail("Benutzername oder Passwort ist falsch", 401);
  }

  const { token, expiresAt } = await createAdminSession(admin.id);

  const cookie = getSessionCookieOptions(expiresAt, request);
  const response = NextResponse.json({ user: { id: admin.id, username: admin.username } });
  response.cookies.set(cookie.name, token, cookie.options);

  return response;
}
