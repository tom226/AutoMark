/**
 * Meta (Facebook + Instagram) Graph API helpers
 * All server-side only — never import these in client components.
 */

const GRAPH = "https://graph.facebook.com/v19.0";

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
}

export interface StoredTokens {
  userToken: string;
  pages: MetaPage[];
  /** Flat list of connected Instagram Business Account IDs + which page they belong to */
  instagramAccounts: Array<{ igId: string; pageId: string; pageName: string }>;
  connectedAt: string;
  linkedin?: {
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
  };
  twitter?: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    profile?: {
      id?: string;
      username?: string;
      name?: string;
    };
    connectedAt: string;
  };
}

export interface PagePostSample {
  id: string;
  message?: string;
  created_time?: string;
}

export interface PageProfileSample {
  id: string;
  name?: string;
  about?: string;
  description?: string;
  category?: string;
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────

export function buildAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    scope: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
      "public_profile",
    ].join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? "Token exchange failed");
  return data.access_token as string;
}

export async function getLongLivedToken(shortToken: string): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("fb_exchange_token", shortToken);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? "LLT exchange failed");
  return data.access_token as string;
}

export async function getPagesWithInstagram(userToken: string): Promise<MetaPage[]> {
  const url = new URL(`${GRAPH}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account");
  url.searchParams.set("access_token", userToken);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? "Failed to fetch pages");
  return data.data as MetaPage[];
}

export async function getRecentPagePosts(
  pageId: string,
  pageToken: string,
  limit = 12
): Promise<PagePostSample[]> {
  const url = new URL(`${GRAPH}/${pageId}/posts`);
  url.searchParams.set("fields", "id,message,created_time");
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 25))));
  url.searchParams.set("access_token", pageToken);

  const response = await fetch(url.toString(), { cache: "no-store" });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to fetch recent page posts");
  }

  return Array.isArray(data.data) ? (data.data as PagePostSample[]) : [];
}

export async function getPageProfile(
  pageId: string,
  pageToken: string
): Promise<PageProfileSample | null> {
  const url = new URL(`${GRAPH}/${pageId}`);
  url.searchParams.set("fields", "id,name,about,description,category");
  url.searchParams.set("access_token", pageToken);

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.error) return null;
    return data as PageProfileSample;
  } catch {
    return null;
  }
}

// ─── Posting helpers ──────────────────────────────────────────────────────────

export async function postToFacebook(
  pageId: string,
  pageToken: string,
  message: string,
  imageUrl?: string
): Promise<{ id: string }> {
  const endpoint = imageUrl
    ? `${GRAPH}/${pageId}/photos`
    : `${GRAPH}/${pageId}/feed`;

  const body: Record<string, string> = {
    access_token: pageToken,
    ...(imageUrl ? { url: imageUrl, caption: message } : { message }),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error)
    throw new Error(data.error?.message ?? "Facebook post failed");
  return data as { id: string };
}

export async function postToInstagram(
  igUserId: string,
  pageToken: string,
  caption: string,
  imageUrl?: string
): Promise<{ id: string }> {
  if (!imageUrl) {
    // Instagram requires media — use a story/text stub with Reels in some cases.
    // For pure text we fall back to a placeholder public image.
    throw new Error(
      "Instagram requires an image URL. Please add an image link to your post."
    );
  }

  // 1 — Create media container
  const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: pageToken,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || createData.error)
    throw new Error(createData.error?.message ?? "IG media creation failed");

  // 2 — Publish
  const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: createData.id,
      access_token: pageToken,
    }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error)
    throw new Error(publishData.error?.message ?? "IG publish failed");
  return publishData as { id: string };
}
