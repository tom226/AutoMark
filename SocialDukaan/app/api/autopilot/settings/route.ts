import { NextResponse } from "next/server";
import {
  ensureAutopilotState,
  saveAutopilotState,
  type AutopilotRuleConfig,
} from "@/lib/autopilot-store";

interface SettingsPayload {
  selectedPageId: string;
  imageUrl?: string;
  campaignTopic?: string;
  rules: AutopilotRuleConfig[];
}

export async function GET() {
  const state = await ensureAutopilotState();
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
  const body = (await request.json()) as SettingsPayload;

  if (!body.selectedPageId) {
    return NextResponse.json({ error: "selectedPageId is required" }, { status: 400 });
  }

  const state = await ensureAutopilotState();
  const nextState = {
    ...state,
    selectedPageId: body.selectedPageId,
    imageUrl: body.imageUrl,
    campaignTopic: body.campaignTopic,
    rules: Array.isArray(body.rules) ? body.rules : [],
  };

  await saveAutopilotState(nextState);

  return NextResponse.json({ saved: true });
}
