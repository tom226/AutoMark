import { NextResponse } from "next/server";
import { getResearchPreferences, saveResearchPreferences } from "@/lib/research-preferences-store";
import { getUserIdFromRequest } from "@/lib/user-session";

interface PreferencePayload {
  platforms?: string[];
  categories?: string[];
  categoryWeights?: Record<string, number>;
  customHashtags?: string[];
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const prefs = await getResearchPreferences(userId);
  return NextResponse.json(prefs);
}

export async function PUT(request: Request) {
  const userId = getUserIdFromRequest(request);
  const body = (await request.json()) as PreferencePayload;
  const saved = await saveResearchPreferences({
    platforms: Array.isArray(body.platforms) ? body.platforms : undefined,
    categories: Array.isArray(body.categories) ? body.categories : undefined,
    categoryWeights:
      body.categoryWeights && typeof body.categoryWeights === "object"
        ? body.categoryWeights
        : undefined,
    customHashtags: Array.isArray(body.customHashtags) ? body.customHashtags : undefined,
  }, userId);

  return NextResponse.json(saved);
}
