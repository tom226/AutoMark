import { NextRequest, NextResponse } from "next/server";
import { exchangeLinkedInCodeForToken, getLinkedInProfile } from "@/lib/linkedin";
import { loadTokens, saveTokens } from "@/lib/token-store";
import { getAppOrigin } from "@/lib/app-origin";

const LINKEDIN_COOKIE = "sd_linkedin_conn";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const origin = getAppOrigin(request.url);

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/dashboard/onboarding?error=${encodeURIComponent(error ?? "linkedin_access_denied")}`,
    );
  }

  try {
    const expectedState = request.cookies.get("linkedin_oauth_state")?.value;
    if (!expectedState || state !== expectedState) {
      throw new Error("Invalid LinkedIn OAuth state");
    }

    const redirectUri = `${origin}/api/auth/linkedin/callback`;
    const token = await exchangeLinkedInCodeForToken(code, redirectUri);
    const profile = await getLinkedInProfile(token.accessToken);

    const existing =
      (await loadTokens()) ?? {
        userToken: "",
        pages: [],
        instagramAccounts: [],
        connectedAt: new Date().toISOString(),
      };

    existing.linkedin = {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresIn ? new Date(Date.now() + token.expiresIn * 1000).toISOString() : undefined,
      profile: {
        id: profile.sub,
        name: profile.name ?? [profile.given_name, profile.family_name].filter(Boolean).join(" "),
        email: profile.email,
        picture: profile.picture,
      },
      connectedAt: new Date().toISOString(),
    };

    await saveTokens(existing);

    const response = NextResponse.redirect(`${origin}/dashboard/onboarding?connected=linkedin`);
    response.cookies.delete("linkedin_oauth_state");
    response.cookies.set(
      LINKEDIN_COOKIE,
      encodeURIComponent(JSON.stringify(existing.linkedin)),
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
    const msg = err instanceof Error ? err.message : "LinkedIn connection failed";
    return NextResponse.redirect(`${origin}/dashboard/onboarding?error=${encodeURIComponent(msg)}`);
  }
}
