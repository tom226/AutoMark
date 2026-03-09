import { NextResponse } from "next/server";
import { loadTokens } from "@/lib/token-store";
import { saveTokens } from "@/lib/token-store";
import { publishToChannels } from "@/lib/social-publisher";
import { validateContentGuardrails } from "@/lib/content-guardrails";
import { getUserIdFromRequest } from "@/lib/user-session";
import { mergeCookieConnectionsIntoTokens } from "@/lib/connection-cookies";

interface PostPayload {
  channels: ("instagram" | "facebook" | "twitter")[];
  caption: string;
  imageUrl?: string;
  pageId?: string;
}

/**
 * POST /api/social/post
 * Posts content to the selected social channels immediately.
 *
 * Body:
 *   channels  – ["instagram", "facebook"] (one or both)
 *   caption   – text content
 *   imageUrl  – publicly accessible image URL (required for Instagram)
 */
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  let tokens = await loadTokens(userId);
  const merged = mergeCookieConnectionsIntoTokens(tokens, request);
  tokens = merged.tokens;

  if (merged.changed && tokens) {
    try {
      await saveTokens(tokens, userId);
    } catch {
      // Ignore persistence failures in serverless file systems.
    }
  }

  if (!tokens) {
    return NextResponse.json(
      { error: "No social accounts connected. Please connect your accounts first at /dashboard/onboarding" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as PostPayload;
  const { channels = [], caption, imageUrl, pageId } = body;

  if (!caption?.trim()) {
    return NextResponse.json({ error: "Caption is required" }, { status: 400 });
  }

  if (channels.length === 0) {
    return NextResponse.json({ error: "Select at least one channel" }, { status: 400 });
  }

  const needsMetaPage = channels.some((channel) => channel === "instagram" || channel === "facebook");
  const selectedPageId = pageId ?? tokens.pages[0]?.id;

  if (needsMetaPage && !selectedPageId) {
    return NextResponse.json(
      { error: "Selected Facebook Page not found. Please reconnect your accounts." },
      { status: 400 }
    );
  }

  for (const channel of channels) {
    const guardrails = validateContentGuardrails({
      caption,
      imageUrl,
      channel,
    });

    if (!guardrails.ok) {
      return NextResponse.json(
        {
          error: `Content guardrail blocked ${channel} post: ${guardrails.errors.join(" ")}`,
        },
        { status: 400 }
      );
    }
  }

  const results = await publishToChannels({
    tokens,
    pageId: selectedPageId ?? "",
    channels,
    caption: caption.trim(),
    imageUrl,
  });

  const allFailed = Object.values(results).every((r) => !r?.success);

  return NextResponse.json(
    { results },
    { status: allFailed && Object.keys(results).length > 0 ? 500 : 200 }
  );
}
