import { NextResponse } from "next/server";
import {
  createOAuthState,
  createCodeVerifier,
  createCodeChallenge,
  buildTwitterAuthUrl,
} from "@/lib/twitter";
import { getAppOrigin } from "@/lib/app-origin";

export async function GET(request: Request) {
  try {
    if (!process.env.TWITTER_CLIENT_ID?.trim()) {
      return NextResponse.json(
        {
          error:
            "Twitter credentials not configured. Add TWITTER_CLIENT_ID (and optionally TWITTER_CLIENT_SECRET) in .env.local",
        },
        { status: 503 },
      );
    }

    const origin = getAppOrigin(request.url);
    const redirectUri = `${origin}/api/auth/twitter/callback`;

    const state = createOAuthState();
    const codeVerifier = createCodeVerifier();
    const codeChallenge = createCodeChallenge(codeVerifier);

    const authUrl = buildTwitterAuthUrl({
      redirectUri,
      state,
      codeChallenge,
    });

    const response = NextResponse.redirect(authUrl);
    const baseCookie = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    };

    response.cookies.set("twitter_oauth_state", state, baseCookie);
    response.cookies.set("twitter_code_verifier", codeVerifier, baseCookie);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start Twitter OAuth" },
      { status: 500 },
    );
  }
}
