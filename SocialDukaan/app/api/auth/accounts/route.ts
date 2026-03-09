import { NextResponse } from "next/server";
import { loadTokens, clearTokens } from "@/lib/token-store";
import { saveTokens } from "@/lib/token-store";
import { getUserIdFromRequest } from "@/lib/user-session";
import {
  LINKEDIN_COOKIE,
  TWITTER_COOKIE,
  getLinkedInCookiePayload,
  getTwitterCookiePayload,
  mergeCookieConnectionsIntoTokens,
} from "@/lib/connection-cookies";

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
  const linkedinFromCookie = getLinkedInCookiePayload(request);
  const twitterFromCookie = getTwitterCookiePayload(request);

  const merged = mergeCookieConnectionsIntoTokens(tokens, request);
  tokens = merged.tokens;
  if (merged.changed && tokens) {
    try {
      await saveTokens(tokens, userId);
    } catch {
      // Cookie-backed fallback still allows account state to be shown in serverless runtimes.
    }
  }

  if (!tokens) {
    const linkedinConnected = Boolean(linkedinFromCookie);
    const twitterConnected = Boolean(twitterFromCookie);
    return NextResponse.json({
      connected: linkedinConnected || twitterConnected,
      pages: [],
      instagramAccounts: [],
      linkedin: {
        connected: linkedinConnected,
        connectedAt: linkedinFromCookie?.connectedAt,
        profile: linkedinFromCookie?.profile,
      },
      twitter: {
        connected: twitterConnected,
        connectedAt: twitterFromCookie?.connectedAt,
        profile: twitterFromCookie?.profile,
      },
      oauth,
    });
  }

  const metaConnected = tokens.pages.length > 0 || tokens.instagramAccounts.length > 0;
  const linkedinConnected = Boolean(tokens.linkedin?.accessToken) || Boolean(linkedinFromCookie);
  const twitterConnected = Boolean(tokens.twitter?.accessToken) || Boolean(twitterFromCookie);

  return NextResponse.json({
    connected: metaConnected || linkedinConnected || twitterConnected,
    connectedAt: tokens.connectedAt,
    pages: tokens.pages.map((p) => ({ id: p.id, name: p.name })),
    instagramAccounts: tokens.instagramAccounts,
    linkedin: {
      connected: linkedinConnected,
      connectedAt: tokens.linkedin?.connectedAt ?? linkedinFromCookie?.connectedAt,
      profile: tokens.linkedin?.profile ?? linkedinFromCookie?.profile,
    },
    twitter: {
      connected: twitterConnected,
      connectedAt: tokens.twitter?.connectedAt ?? twitterFromCookie?.connectedAt,
      profile: tokens.twitter?.profile ?? twitterFromCookie?.profile,
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
