import { NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getPagesWithInstagram,
  type StoredTokens,
} from "@/lib/meta";
import { saveTokens } from "@/lib/token-store";
import { getAppOrigin } from "@/lib/app-origin";

/**
 * GET /api/auth/meta/callback
 * Handles the Facebook OAuth redirect, stores tokens in a cookie,
 * and redirects the user back to the onboarding page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  const origin = getAppOrigin(request.url);
  const redirectUri = `${origin}/api/auth/meta/callback`;

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/dashboard/onboarding?error=${encodeURIComponent(
        error ?? "access_denied"
      )}`
    );
  }

  try {
    // Exchange short-lived code → short-lived token → long-lived token
    const shortToken = await exchangeCodeForToken(code, redirectUri);
    const longToken = await getLongLivedToken(shortToken);

    // Fetch pages + instagram business accounts
    const pages = await getPagesWithInstagram(longToken);

    const instagramAccounts = pages
      .filter((p) => p.instagram_business_account?.id)
      .map((p) => ({
        igId: p.instagram_business_account!.id,
        pageId: p.id,
        pageName: p.name,
      }));

    const stored: StoredTokens = {
      userToken: longToken,
      pages,
      instagramAccounts,
      connectedAt: new Date().toISOString(),
    };

    // Save tokens to file (dev) or database (production)
    await saveTokens(stored);

    return NextResponse.redirect(`${origin}/dashboard/onboarding?connected=1`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      `${origin}/dashboard/onboarding?error=${encodeURIComponent(msg)}`
    );
  }
}
