export interface GuardrailResult {
  ok: boolean;
  normalizedCaption: string;
  errors: string[];
  warnings: string[];
}

const BLOCKED_PHRASES = [
  "guaranteed overnight results",
  "100% guaranteed",
  "hate",
  "kill",
  "violence",
];

function normalizeCaption(caption: string): string {
  return caption
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractHashtags(caption: string): string[] {
  return caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
}

export function validateContentGuardrails(input: {
  caption: string;
  imageUrl?: string;
  channel?: "instagram" | "facebook" | "linkedin" | "twitter";
}): GuardrailResult {
  const normalizedCaption = normalizeCaption(input.caption ?? "");
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!normalizedCaption) {
    errors.push("Caption cannot be empty.");
  }

  if (normalizedCaption.length > 2200) {
    errors.push("Caption exceeds 2200 characters.");
  }

  const lowered = normalizedCaption.toLowerCase();
  for (const phrase of BLOCKED_PHRASES) {
    if (lowered.includes(phrase)) {
      errors.push(`Blocked phrase detected: \"${phrase}\"`);
    }
  }

  const hashtags = extractHashtags(normalizedCaption);
  if (hashtags.length > 15) {
    errors.push("Too many hashtags. Keep hashtags at 15 or fewer.");
  }

  const uniqueHashtags = new Set(hashtags.map((tag) => tag.toLowerCase()));
  if (hashtags.length > uniqueHashtags.size) {
    warnings.push("Duplicate hashtags detected.");
  }

  if (input.channel === "instagram" && !input.imageUrl) {
    errors.push("Instagram post requires a public image URL.");
  }

  if (input.imageUrl) {
    try {
      const parsed = new URL(input.imageUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        errors.push("Image URL must use http or https.");
      }
    } catch {
      errors.push("Image URL is invalid.");
    }
  }

  return {
    ok: errors.length === 0,
    normalizedCaption,
    errors,
    warnings,
  };
}
