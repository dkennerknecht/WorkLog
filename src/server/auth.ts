import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_TTL_HOURS } from "@/lib/env";
import { prisma } from "@/lib/prisma";

function hashToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function verifyAdminCredentials(username: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin || !admin.isActive) {
    return null;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return null;
  }

  return admin;
}

export async function createAdminSession(adminUserId: string) {
  const token = crypto.randomUUID();
  const tokenHash = hashToken(token);

  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash,
      expiresAt
    }
  });

  return { token, expiresAt };
}

export async function clearAdminSession(token: string | undefined | null) {
  if (!token) {
    return;
  }

  await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function getAdminFromToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const session = await prisma.adminSession.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() }
    },
    include: {
      adminUser: true
    }
  });

  if (!session || !session.adminUser.isActive) {
    return null;
  }

  return session.adminUser;
}

export async function getAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return getAdminFromToken(token);
}

export async function getAdminFromServerCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getAdminFromToken(token);
}

function shouldUseSecureCookie(request?: Request | NextRequest): boolean {
  if (!request) {
    return process.env.NODE_ENV === "production";
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function getSessionCookieOptions(expiresAt: Date, request?: Request | NextRequest) {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "lax" as const,
      path: "/",
      expires: expiresAt
    }
  };
}
