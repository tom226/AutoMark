import { NextResponse } from "next/server";
import { loadTokens, clearTokens } from "@/lib/token-store";
import { saveTokens } from "@/lib/token-store";
import { getUserIdFromRequest } from "@/lib/user-session";

const LINKEDIN_COOKIE = "sd_linkedin_conn";
const TWITTER_COOKIE = "sd_twitter_conn";

function parseCookieJson<T>(value?: string): T | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return null;
  }
}

/**
 * GET /api/auth/accounts
 * Returns which social accounts are connected (reads the cookie).
 * Does NOT expose access tokens to the client.
 */
export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const oauth = {
    metaConfigured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    linkedinConfigured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    twitterConfigured: Boolean(process.env.TWITTER_CLIENT_ID),
  };

  let tokens = await loadTokens(userId);

  const linkedinFromCookie = parseCookieJson<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    profile?: { id?: string; name?: string; email?: string; picture?: string };
    connectedAt: string;
  }>(request.headers.get("cookie")?.match(/(?:^|; )sd_linkedin_conn=([^;]+)/)?.[1]);

  const twitterFromCookie = parseCookieJson<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    profile?: { id?: string; username?: string; name?: string };
    connectedAt: string;
  }>(request.headers.get("cookie")?.match(/(?:^|; )sd_twitter_conn=([^;]+)/)?.[1]);

  if (!tokens && (linkedinFromCookie || twitterFromCookie)) {
    tokens = {
      userToken: "",
      pages: [],
      instagramAccounts: [],
      connectedAt: new Date().toISOString(),
      linkedin: linkedinFromCookie ?? undefined,
      twitter: twitterFromCookie ?? undefined,
    };
    await saveTokens(tokens, userId);
  } else if (tokens) {
    let changed = false;
    if (!tokens.linkedin?.accessToken && linkedinFromCookie?.accessToken) {
      tokens.linkedin = linkedinFromCookie;
      changed = true;
    }
    if (!tokens.twitter?.accessToken && twitterFromCookie?.accessToken) {
      tokens.twitter = twitterFromCookie;
      changed = true;
    }
    if (changed) {
      await saveTokens(tokens, userId);
    }
  }

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
  const userId = getUserIdFromRequest(request);
  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") ?? "all").toLowerCase();

  if (provider === "all") {
    await clearTokens(userId);
    const response = NextResponse.json({ disconnected: true, provider: "all" });
    response.cookies.delete(LINKEDIN_COOKIE);
    response.cookies.delete(TWITTER_COOKIE);
    return response;
  }

  const tokens = await loadTokens(userId);
  if (!tokens) {
    const response = NextResponse.json({ disconnected: true, provider, noop: true });
    if (provider === "linkedin") response.cookies.delete(LINKEDIN_COOKIE);
    if (provider === "twitter") response.cookies.delete(TWITTER_COOKIE);
    return response;
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
    await clearTokens(userId);
    const response = NextResponse.json({ disconnected: true, provider });
    if (provider === "linkedin") response.cookies.delete(LINKEDIN_COOKIE);
    if (provider === "twitter") response.cookies.delete(TWITTER_COOKIE);
    return response;
  }

  await saveTokens(tokens, userId);
  const response = NextResponse.json({ disconnected: true, provider });
  if (provider === "linkedin") response.cookies.delete(LINKEDIN_COOKIE);
  if (provider === "twitter") response.cookies.delete(TWITTER_COOKIE);
  return response;
}
