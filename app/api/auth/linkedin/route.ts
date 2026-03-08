import { NextResponse } from "next/server";
import { buildLinkedInAuthUrl } from "@/lib/linkedin";
import { createOAuthState } from "@/lib/twitter";
import { getAppOrigin } from "@/lib/app-origin";

export async function GET(request: Request) {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
    const origin = getAppOrigin(request.url);

    const invalidClientId =
      !clientId || clientId.includes("your_linkedin_client_id_here") || clientId.startsWith("your_");
    const invalidClientSecret =
      !clientSecret ||
      clientSecret.includes("your_linkedin_client_secret_here") ||
      clientSecret.startsWith("your_");

    if (invalidClientId || invalidClientSecret) {
      const msg =
        "LinkedIn credentials are not set. Update LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env.local and restart dev server.";
      return NextResponse.redirect(`${origin}/dashboard/onboarding?error=${encodeURIComponent(msg)}`);
    }

    const redirectUri = `${origin}/api/auth/linkedin/callback`;
    const state = createOAuthState();
    const authUrl = buildLinkedInAuthUrl(redirectUri, state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("linkedin_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start LinkedIn OAuth" },
      { status: 500 },
    );
  }
}
