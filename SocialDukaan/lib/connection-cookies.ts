import type { StoredTokens } from "@/lib/meta";

export const LINKEDIN_COOKIE = "sd_linkedin_conn";
export const TWITTER_COOKIE = "sd_twitter_conn";

interface LinkedInCookiePayload {
  connectedAt?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  profile?: { id?: string; name?: string; email?: string };
}

interface TwitterCookiePayload {
  connectedAt?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  profile?: { id?: string; username?: string; name?: string };
}

function parseCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|; )${escaped}=([^;]+)`));
  return match?.[1];
}

function parseCookieJson<T>(value?: string): T | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return null;
  }
}

export function getLinkedInCookiePayload(request: Request): LinkedInCookiePayload | null {
  return parseCookieJson<LinkedInCookiePayload>(
    parseCookieValue(request.headers.get("cookie"), LINKEDIN_COOKIE),
  );
}

export function getTwitterCookiePayload(request: Request): TwitterCookiePayload | null {
  return parseCookieJson<TwitterCookiePayload>(
    parseCookieValue(request.headers.get("cookie"), TWITTER_COOKIE),
  );
}

export function mergeCookieConnectionsIntoTokens(
  tokens: StoredTokens | null,
  request: Request,
): { tokens: StoredTokens | null; changed: boolean } {
  const linkedinFromCookie = getLinkedInCookiePayload(request);
  const twitterFromCookie = getTwitterCookiePayload(request);

  let changed = false;
  let next = tokens;

  if (!next && (linkedinFromCookie?.accessToken || twitterFromCookie?.accessToken)) {
    next = {
      userToken: "",
      pages: [],
      instagramAccounts: [],
      connectedAt: new Date().toISOString(),
    };
    changed = true;
  }

  if (!next) {
    return { tokens: null, changed: false };
  }

  if (linkedinFromCookie?.accessToken) {
    const missingLinkedInToken = !next.linkedin?.accessToken;
    const missingLinkedInProfile = !next.linkedin?.profile && !!linkedinFromCookie.profile;

    if (missingLinkedInToken || missingLinkedInProfile) {
      next.linkedin = {
        accessToken: linkedinFromCookie.accessToken,
        refreshToken: linkedinFromCookie.refreshToken,
        expiresAt: linkedinFromCookie.expiresAt,
        profile: linkedinFromCookie.profile,
        connectedAt: next.linkedin?.connectedAt ?? linkedinFromCookie.connectedAt ?? new Date().toISOString(),
      };
      changed = true;
    }
  }

  if (twitterFromCookie?.accessToken) {
    const missingTwitterToken = !next.twitter?.accessToken;
    const missingTwitterProfile = !next.twitter?.profile && !!twitterFromCookie.profile;

    if (missingTwitterToken || missingTwitterProfile) {
      next.twitter = {
        accessToken: twitterFromCookie.accessToken,
        refreshToken: twitterFromCookie.refreshToken,
        expiresAt: twitterFromCookie.expiresAt,
        profile: twitterFromCookie.profile,
        connectedAt: next.twitter?.connectedAt ?? twitterFromCookie.connectedAt ?? new Date().toISOString(),
      };
      changed = true;
    }
  }

  return { tokens: next, changed };
}
