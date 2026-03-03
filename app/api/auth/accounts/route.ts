import { NextResponse } from "next/server";
import { loadTokens, clearTokens } from "@/lib/token-store";

/**
 * GET /api/auth/accounts
 * Returns which social accounts are connected (reads the cookie).
 * Does NOT expose access tokens to the client.
 */
export async function GET() {
  const tokens = await loadTokens();
  if (!tokens) {
    return NextResponse.json({ connected: false, pages: [], instagramAccounts: [] });
  }
  return NextResponse.json({
    connected: true,
    connectedAt: tokens.connectedAt,
    pages: tokens.pages.map((p) => ({ id: p.id, name: p.name })),
    instagramAccounts: tokens.instagramAccounts,
  });
}

/**
 * DELETE /api/auth/accounts
 * Disconnects all accounts.
 */
export async function DELETE() {
  await clearTokens();
  return NextResponse.json({ disconnected: true });
}
