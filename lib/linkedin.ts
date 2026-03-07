const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_ME_URL = "https://api.linkedin.com/v2/me";
const LINKEDIN_EMAIL_URL =
  "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))";

export interface LinkedInProfile {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
}

export interface LinkedInConnection {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  profile?: {
    id?: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  connectedAt: string;
}

export function buildLinkedInAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId || clientId.includes("your_linkedin_client_id_here") || clientId.startsWith("your_")) {
    throw new Error("LINKEDIN_CLIENT_ID is not configured");
  }

  // Keep default scopes minimal so OAuth works even when posting scopes are not approved yet.
  const rawScopes = (process.env.LINKEDIN_SCOPES ?? "openid profile email")
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
  const scopes = rawScopes.length > 0 ? rawScopes : ["openid", "profile", "email"];

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(" "),
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLinkedInCodeForToken(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  const invalidClientId =
    !clientId || clientId.includes("your_linkedin_client_id_here") || clientId.startsWith("your_");
  const invalidClientSecret =
    !clientSecret ||
    clientSecret.includes("your_linkedin_client_secret_here") ||
    clientSecret.startsWith("your_");

  if (invalidClientId || invalidClientSecret) {
    throw new Error("LinkedIn credentials are missing in environment");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error_description ?? data.error ?? "LinkedIn token exchange failed");
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    expiresIn: data.expires_in as number | undefined,
  };
}

export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // Preferred path for OpenID scopes.
  const userInfoRes = await fetch(LINKEDIN_USERINFO_URL, {
    headers,
    cache: "no-store",
  });

  if (userInfoRes.ok) {
    const data = (await userInfoRes.json()) as LinkedInProfile;
    return data;
  }

  // Fallback path for legacy scopes: r_liteprofile + r_emailaddress.
  const meRes = await fetch(LINKEDIN_ME_URL, { headers, cache: "no-store" });
  const emailRes = await fetch(LINKEDIN_EMAIL_URL, { headers, cache: "no-store" });

  if (!meRes.ok) {
    const errText = await meRes.text();
    throw new Error(errText || "Failed to fetch LinkedIn profile");
  }

  const meData = (await meRes.json()) as {
    id?: string;
    localizedFirstName?: string;
    localizedLastName?: string;
  };

  let email: string | undefined;
  if (emailRes.ok) {
    const emailData = (await emailRes.json()) as {
      elements?: Array<{ "handle~"?: { emailAddress?: string } }>;
    };
    email = emailData.elements?.[0]?.["handle~"]?.emailAddress;
  }

  const name = [meData.localizedFirstName, meData.localizedLastName].filter(Boolean).join(" ");

  return {
    sub: meData.id,
    name: name || undefined,
    given_name: meData.localizedFirstName,
    family_name: meData.localizedLastName,
    email,
  };
}
