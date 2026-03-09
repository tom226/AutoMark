import type { NextRequest } from "next/server";

export const USER_SESSION_COOKIE = "sd_user_id";

function readCookieFromHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|; )${escaped}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function sanitizeUserId(input: string | null | undefined): string {
  const fallback = "anon";
  if (!input) return fallback;
  const normalized = input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!normalized) return fallback;
  return normalized.slice(0, 64);
}

export function getUserIdFromRequest(request: Request | NextRequest): string {
  const cookieHeader = request.headers.get("cookie");
  return sanitizeUserId(readCookieFromHeader(cookieHeader, USER_SESSION_COOKIE));
}

export function createSessionUserId(): string {
  try {
    return `u_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  } catch {
    return `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function userScopedKey(baseKey: string, userId: string): string {
  return `${baseKey}:${sanitizeUserId(userId)}`;
}

export function userScopedRelativePath(relativePath: string, userId: string): string {
  const safeUserId = sanitizeUserId(userId);
  const lastDot = relativePath.lastIndexOf(".");
  if (lastDot <= 0) {
    return `${relativePath}.${safeUserId}`;
  }

  const head = relativePath.slice(0, lastDot);
  const ext = relativePath.slice(lastDot);
  return `${head}.${safeUserId}${ext}`;
}
