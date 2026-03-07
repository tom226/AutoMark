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
    return NextResponse.json({
      connected: false,
      pages: [],
      instagramAccounts: [],
      linkedin: { connected: false },
      twitter: { connected: false },
    });
  }

  const metaConnected = tokens.pages.length > 0 || tokens.instagramAccounts.length > 0;
  const linkedinConnected = Boolean(tokens.linkedin?.accessToken);
  const twitterConnected = Boolean(tokens.twitter?.accessToken);

  return NextResponse.json({
    connected: metaConnected || linkedinConnected || twitterConnected,
    connectedAt: tokens.connectedAt,
    pages: tokens.pages.map((p) => ({ id: p.id, name: p.name })),
    instagramAccounts: tokens.instagramAccounts,
    linkedin: {
      connected: linkedinConnected,
      connectedAt: tokens.linkedin?.connectedAt,
      profile: tokens.linkedin?.profile,
    },
    twitter: {
      connected: twitterConnected,
      connectedAt: tokens.twitter?.connectedAt,
      profile: tokens.twitter?.profile,
    },
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
