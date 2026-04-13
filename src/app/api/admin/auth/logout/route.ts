import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/env";
import { clearAdminSession, getSessionCookieOptions } from "@/server/auth";

export async function POST(request: Request) {
  const rawCookie = request.headers.get("cookie") ?? "";
  const token = rawCookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  await clearAdminSession(token ?? null);

  const cookie = getSessionCookieOptions(new Date(0), request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, "", cookie.options);
  return response;
}
