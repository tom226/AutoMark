import { NextResponse } from "next/server";
import type { Channel } from "@/lib/types";
import { updateCompetitorVerification } from "@/lib/competitor-store";
import { getUserIdFromRequest } from "@/lib/user-session";

interface VerifyPayload {
  handle?: string;
  channel?: Channel;
  competitorId?: string;
}

function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function getProfileUrl(channel: Channel, normalizedHandle: string): string {
  switch (channel) {
    case "instagram":
      return `https://www.instagram.com/${normalizedHandle}/`;
    case "facebook":
      return `https://www.facebook.com/${normalizedHandle}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${normalizedHandle}`;
    case "twitter":
      return `https://x.com/${normalizedHandle}`;
    case "sharechat":
      return `https://sharechat.com/profile/${normalizedHandle}`;
    case "moj":
      return `https://mojapp.in/@${normalizedHandle}`;
    case "josh":
      return `https://share.myjosh.in/profile/${normalizedHandle}`;
    default:
      return `https://x.com/${normalizedHandle}`;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "SocialDukaanBot/1.0 (+https://socialdukaan.local)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  const body = (await request.json()) as VerifyPayload;
  const channel = body.channel;
  const rawHandle = body.handle;
  const competitorId = body.competitorId;

  if (!channel || !rawHandle?.trim()) {
    return NextResponse.json({ error: "handle and channel are required" }, { status: 400 });
  }

  const normalized = normalizeHandle(rawHandle);
  if (!normalized) {
    return NextResponse.json({ error: "invalid handle" }, { status: 400 });
  }

  const profileUrl = getProfileUrl(channel, normalized);

  try {
    const response = await fetchWithTimeout(profileUrl);

    if (response.status === 200) {
      if (competitorId) {
        await updateCompetitorVerification({
          id: competitorId,
          verificationStatus: "verified",
          verificationMessage: "Profile appears reachable.",
        }, userId);
      }
      return NextResponse.json({
        status: "verified",
        message: "Profile appears reachable.",
        checkedUrl: profileUrl,
        statusCode: response.status,
      });
    }

    if (response.status === 404) {
      if (competitorId) {
        await updateCompetitorVerification({
          id: competitorId,
          verificationStatus: "not_found",
          verificationMessage: "Profile not found on selected platform.",
        }, userId);
      }
      return NextResponse.json({
        status: "not_found",
        message: "Profile not found on selected platform.",
        checkedUrl: profileUrl,
        statusCode: response.status,
      });
    }

    if (competitorId) {
      await updateCompetitorVerification({
        id: competitorId,
        verificationStatus: "unknown",
        verificationMessage: "Platform restricted validation. Manual check recommended.",
      }, userId);
    }
    return NextResponse.json({
      status: "unknown",
      message: "Platform restricted validation. Manual check recommended.",
      checkedUrl: profileUrl,
      statusCode: response.status,
    });
  } catch {
    if (competitorId) {
      await updateCompetitorVerification({
        id: competitorId,
        verificationStatus: "unknown",
        verificationMessage: "Could not verify right now (network/protection). Manual check recommended.",
      }, userId);
    }
    return NextResponse.json({
      status: "unknown",
      message: "Could not verify right now (network/protection). Manual check recommended.",
      checkedUrl: profileUrl,
    });
  }
}
