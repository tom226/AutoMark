import { NextResponse } from "next/server";
import {
  ensureAutopilotState,
  saveAutopilotState,
  type AutopilotRuleConfig,
} from "@/lib/autopilot-store";
import { getUserIdFromRequest } from "@/lib/user-session";

interface SettingsPayload {
  selectedPageId: string;
  imageUrl?: string;
  campaignTopic?: string;
  rules: AutopilotRuleConfig[];
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const state = await ensureAutopilotState(undefined, userId);
  return NextResponse.json({
    selectedPageId: state.selectedPageId,
    imageUrl: state.imageUrl,
    campaignTopic: state.campaignTopic,
    rules: state.rules,
    jobsCount: state.jobs.length,
    lastGeneratedDate: state.lastGeneratedDate,
  });
}

export async function PUT(request: Request) {
  const userId = getUserIdFromRequest(request);
  const body = (await request.json()) as SettingsPayload;

  if (!body.selectedPageId) {
    return NextResponse.json({ error: "selectedPageId is required" }, { status: 400 });
  }

  const state = await ensureAutopilotState(undefined, userId);
  const nextState = {
    ...state,
    selectedPageId: body.selectedPageId,
    imageUrl: body.imageUrl,
    campaignTopic: body.campaignTopic,
    rules: Array.isArray(body.rules) ? body.rules : [],
  };

  await saveAutopilotState(nextState, userId);

  return NextResponse.json({ saved: true });
}
