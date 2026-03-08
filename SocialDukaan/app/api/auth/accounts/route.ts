import { NextResponse } from "next/server";
import { loadTokens, clearTokens } from "@/lib/token-store";
import { saveTokens } from "@/lib/token-store";

/**
 * GET /api/auth/accounts
 * Returns which social accounts are connected (reads the cookie).
 * Does NOT expose access tokens to the client.
 */
export async function GET() {
  const oauth = {
    metaConfigured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    linkedinConfigured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    twitterConfigured: Boolean(process.env.TWITTER_CLIENT_ID),
  };

  const tokens = await loadTokens();
  if (!tokens) {
    return NextResponse.json({
      connected: false,
      pages: [],
      instagramAccounts: [],
      linkedin: { connected: false },
      twitter: { connected: false },
      oauth,
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
    oauth,
  });
}

/**
 * DELETE /api/auth/accounts
 * Disconnects all accounts or a specific provider using ?provider=
 * Supported values: all | meta | facebook | instagram | linkedin | twitter
 */
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") ?? "all").toLowerCase();

  if (provider === "all") {
    await clearTokens();
    return NextResponse.json({ disconnected: true, provider: "all" });
  }

  const tokens = await loadTokens();
  if (!tokens) {
    return NextResponse.json({ disconnected: true, provider, noop: true });
  }

  if (provider === "meta" || provider === "facebook") {
    tokens.pages = [];
    tokens.userToken = tokens.instagramAccounts.length > 0 ? tokens.userToken : "";
  }

  if (provider === "meta" || provider === "instagram") {
    tokens.instagramAccounts = [];
    tokens.userToken = tokens.pages.length > 0 ? tokens.userToken : "";
  }

  if (provider === "linkedin") {
    delete tokens.linkedin;
  }

  if (provider === "twitter") {
    delete tokens.twitter;
  }

  const hasAnyConnected =
    tokens.pages.length > 0 ||
    tokens.instagramAccounts.length > 0 ||
    Boolean(tokens.linkedin?.accessToken) ||
    Boolean(tokens.twitter?.accessToken);

  if (!hasAnyConnected) {
    await clearTokens();
    return NextResponse.json({ disconnected: true, provider });
  }

  await saveTokens(tokens);
  return NextResponse.json({ disconnected: true, provider });
}
