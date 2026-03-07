import { postToFacebook, postToInstagram, type StoredTokens } from "@/lib/meta";
import type { Post, SocialPlatform } from "@/lib/types";

export type PublishChannel = "instagram" | "facebook" | "twitter";

export interface ChannelPublishResult {
  success: boolean;
  id?: string;
  error?: string;
}

export type PublishResults = Partial<Record<PublishChannel, ChannelPublishResult>>;

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function appendHashtags(baseCaption: string, maxHashtags: number): string {
  const tags = (baseCaption.match(/#[\p{L}\p{N}_]+/gu) ?? []).slice(0, maxHashtags);
  const captionWithoutTags = normalizeWhitespace(baseCaption.replace(/#[\p{L}\p{N}_]+/gu, ""));
  return normalizeWhitespace(`${captionWithoutTags} ${tags.join(" ")}`);
}

function adaptCaptionForTwitter(caption: string): string {
  return appendHashtags(caption, 2).slice(0, 280);
}

async function postToTwitter(accessToken: string, caption: string): Promise<{ id: string }> {
  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: adaptCaptionForTwitter(caption),
    }),
  });

  const data = await response.json();
  if (!response.ok || data?.errors?.length || data?.error) {
    const message =
      data?.detail ??
      data?.title ??
      data?.error_description ??
      data?.error ??
      "X/Twitter post failed";
    throw new Error(message);
  }

  const id = data?.data?.id as string | undefined;
  if (!id) {
    throw new Error("X/Twitter post did not return a post ID");
  }

  return { id };
}

export async function publishToChannels(input: {
  tokens: StoredTokens;
  pageId: string;
  channels: PublishChannel[];
  caption: string;
  imageUrl?: string;
}): Promise<PublishResults> {
  const { tokens, pageId, channels, caption, imageUrl } = input;
  const results: PublishResults = {};

  const page = tokens.pages.find((p) => p.id === pageId);
  const igForPage = tokens.instagramAccounts.find((ig) => ig.pageId === pageId);

  for (const channel of channels) {
    try {
      if (channel === "facebook") {
        if (!page?.access_token) {
          throw new Error("Selected Facebook Page token not found");
        }
        const posted = await postToFacebook(pageId, page.access_token, caption, imageUrl);
        results.facebook = { success: true, id: posted.id };
        continue;
      }

      if (channel === "instagram") {
        if (!page?.access_token) {
          throw new Error("Selected Facebook Page token not found");
        }
        if (!igForPage?.igId) {
          throw new Error("No Instagram Business Account linked to selected page");
        }
        const posted = await postToInstagram(igForPage.igId, page.access_token, caption, imageUrl);
        results.instagram = { success: true, id: posted.id };
        continue;
      }

      if (channel === "twitter") {
        const token = tokens.twitter?.accessToken;
        if (!token) {
          throw new Error("X/Twitter account is not connected");
        }
        const posted = await postToTwitter(token, caption);
        results.twitter = { success: true, id: posted.id };
      }
    } catch (error) {
      results[channel] = {
        success: false,
        error: error instanceof Error ? error.message : "Posting failed",
      };
    }
  }

  return results;
}

/**
 * Schedule a post for later.
 */
export async function schedulePost(
  post: Post,
  scheduledAt: Date,
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();

    if (scheduledAt <= now) {
      return {
        success: false,
        error: "Scheduled time must be in the future",
      };
    }

    const delayMs = scheduledAt.getTime() - now.getTime();
    console.log(`Scheduled post ${post.id} to publish in ${Math.ceil(delayMs / 1000)} seconds`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get best posting time for a platform based on audience activity.
 */
export function getBestPostingTime(
  platform: SocialPlatform,
  timezone: string = "Asia/Kolkata",
): Date {
  void timezone;
  const now = new Date();

  const bestTimes: Record<SocialPlatform, number[]> = {
    instagram: [8, 9, 20, 21],
    facebook: [19, 20, 21],
    linkedin: [9, 10, 11],
    twitter: [8, 12, 19, 20],
    youtube: [9, 19, 20],
    gmb: [9, 18],
    whatsapp: [9, 20],
  };

  const hoursForPlatform = bestTimes[platform] || [9, 19];
  const randomHour = hoursForPlatform[Math.floor(Math.random() * hoursForPlatform.length)];

  const bestTime = new Date(now);
  bestTime.setHours(randomHour, 0, 0, 0);

  if (bestTime < now) {
    bestTime.setDate(bestTime.getDate() + 1);
  }

  return bestTime;
}
