import { postToFacebook, postToInstagram, type StoredTokens } from "@/lib/meta";

export type SupportedPublishChannel = "instagram" | "facebook";

export async function publishToChannels(params: {
  tokens: StoredTokens;
  pageId: string;
  channels: SupportedPublishChannel[];
  caption: string;
  imageUrl?: string;
}): Promise<Record<string, { success: boolean; id?: string; error?: string }>> {
  const { tokens, pageId, channels, caption, imageUrl } = params;
  const results: Record<string, { success: boolean; id?: string; error?: string }> = {};

  const selectedPage = tokens.pages.find((page) => page.id === pageId);
  if (!selectedPage) {
    return {
      auth: {
        success: false,
        error: "Selected Facebook Page not found. Please reconnect your accounts.",
      },
    };
  }

  if (channels.includes("facebook")) {
    try {
      const fb = await postToFacebook(selectedPage.id, selectedPage.access_token, caption, imageUrl);
      results.facebook = { success: true, id: fb.id };
    } catch (err: unknown) {
      results.facebook = {
        success: false,
        error: err instanceof Error ? err.message : "Facebook post failed",
      };
    }
  }

  if (channels.includes("instagram")) {
    const ig = tokens.instagramAccounts.find((account) => account.pageId === selectedPage.id);
    if (!ig) {
      results.instagram = {
        success: false,
        error:
          "No Instagram Business Account is linked to the selected page. Choose another page or connect Instagram to this page.",
      };
    } else {
      try {
        const post = await postToInstagram(ig.igId, selectedPage.access_token, caption, imageUrl);
        results.instagram = { success: true, id: post.id };
      } catch (err: unknown) {
        results.instagram = {
          success: false,
          error: err instanceof Error ? err.message : "Instagram post failed",
        };
      }
    }
  }

  return results;
}
