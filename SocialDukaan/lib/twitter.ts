import crypto from "crypto";

const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWITTER_ME_URL = "https://api.twitter.com/2/users/me";

export interface TwitterConnection {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  profile?: {
    id?: string;
    username?: string;
    name?: string;
  };
  connectedAt: string;
}

function toBase64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createOAuthState(): string {
  return toBase64Url(crypto.randomBytes(24));
}

export function createCodeVerifier(): string {
  return toBase64Url(crypto.randomBytes(64));
}

export function createCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  return toBase64Url(hash);
}

export function buildTwitterAuthUrl(params: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    throw new Error("TWITTER_CLIENT_ID is not configured");
  }

  // Keep default scopes minimal for first-time authorization.
  const rawScopes = (process.env.TWITTER_SCOPES ?? "tweet.read users.read")
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
  const scopes = rawScopes.length > 0 ? rawScopes : ["tweet.read", "users.read"];

  const searchParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: params.redirectUri,
    scope: scopes.join(" "),
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
  });

  return `${TWITTER_AUTH_URL}?${searchParams.toString()}`;
}

export async function exchangeTwitterCodeForToken(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId) {
    throw new Error("TWITTER_CLIENT_ID is not configured");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: clientId,
    code_verifier: params.codeVerifier,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${basic}`;
  }

  const response = await fetch(TWITTER_TOKEN_URL, {
    method: "POST",
    headers,
    body,
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error_description ?? data.error ?? "Twitter token exchange failed");
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    expiresIn: data.expires_in as number | undefined,
  };
}

export async function getTwitterProfile(accessToken: string): Promise<{
  id?: string;
  username?: string;
  name?: string;
}> {
  const response = await fetch(`${TWITTER_ME_URL}?user.fields=name,username`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.detail ?? data.error ?? "Failed to fetch Twitter profile");
  }

  return data.data ?? {};
}
