import { NextRequest, NextResponse } from "next/server";
import { exchangeTwitterCodeForToken, getTwitterProfile } from "@/lib/twitter";
import { loadTokens, saveTokens } from "@/lib/token-store";
import { getAppOrigin } from "@/lib/app-origin";
import { getUserIdFromRequest } from "@/lib/user-session";
import { TWITTER_COOKIE } from "@/lib/connection-cookies";

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const origin = getAppOrigin(request.url);

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/dashboard/onboarding?error=${encodeURIComponent(error ?? "twitter_access_denied")}`,
    );
  }

  try {
    const expectedState = request.cookies.get("twitter_oauth_state")?.value;
    const codeVerifier = request.cookies.get("twitter_code_verifier")?.value;

    if (!expectedState || state !== expectedState) {
      throw new Error("Invalid Twitter OAuth state");
    }
    if (!codeVerifier) {
      throw new Error("Missing Twitter OAuth code verifier");
    }

    const redirectUri = `${origin}/api/auth/twitter/callback`;
    const token = await exchangeTwitterCodeForToken({
      code,
      redirectUri,
      codeVerifier,
    });
    const profile = await getTwitterProfile(token.accessToken);

    const existing =
      (await loadTokens(userId)) ?? {
        userToken: "",
        pages: [],
        instagramAccounts: [],
        connectedAt: new Date().toISOString(),
      };

    existing.twitter = {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresIn ? new Date(Date.now() + token.expiresIn * 1000).toISOString() : undefined,
      profile: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
      },
      connectedAt: new Date().toISOString(),
    };

    await saveTokens(existing, userId);

    const response = NextResponse.redirect(`${origin}/dashboard/onboarding?connected=twitter`);
    response.cookies.delete("twitter_oauth_state");
    response.cookies.delete("twitter_code_verifier");
    response.cookies.set(
      TWITTER_COOKIE,
      encodeURIComponent(
        JSON.stringify({
          connectedAt: existing.twitter.connectedAt,
          accessToken: existing.twitter.accessToken,
          refreshToken: existing.twitter.refreshToken,
          expiresAt: existing.twitter.expiresAt,
          profile: existing.twitter.profile,
        }),
      ),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      },
    );
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Twitter connection failed";
    return NextResponse.redirect(`${origin}/dashboard/onboarding?error=${encodeURIComponent(msg)}`);
  }
}
