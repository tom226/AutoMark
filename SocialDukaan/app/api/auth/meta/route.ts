import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/meta";

/**
 * GET /api/auth/meta
 * Redirects the user to the Facebook OAuth consent screen.
 */
export async function GET(request: Request) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret || appId === "your_meta_app_id_here") {
    return NextResponse.json(
      {
        error: "META credentials not configured. Open .env.local and add META_APP_ID and META_APP_SECRET from https://developers.facebook.com/apps/",
      },
      { status: 503 }
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/meta/callback`;
  const authUrl = buildAuthUrl(redirectUri);

  return NextResponse.redirect(authUrl);
}
