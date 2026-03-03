import { NextResponse } from "next/server";
import {
  createExperiment,
  evaluateExperiment,
  listExperiments,
  updateExperimentMetrics,
} from "@/lib/experiment-store";
import type { Channel, ExperimentVariantKey } from "@/lib/types";

interface CreateExperimentPayload {
  action: "create";
  channel: Channel;
  pageId?: string;
  topic?: string;
  baseCaption: string;
  variantB?: string;
}

interface TrackExperimentPayload {
  action: "track";
  experimentId: string;
  variant: ExperimentVariantKey;
  impressions: number;
  engagements: number;
}

interface EvaluateExperimentPayload {
  action: "evaluate";
  experimentId: string;
}

type ExperimentPayload =
  | CreateExperimentPayload
  | TrackExperimentPayload
  | EvaluateExperimentPayload;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status = statusParam === "running" || statusParam === "completed" ? statusParam : undefined;

  const experiments = await listExperiments(status);
  return NextResponse.json({ experiments });
}

export async function POST(request: Request) {
  const body = (await request.json()) as ExperimentPayload;

  if (!body?.action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  if (body.action === "create") {
    if (!body.baseCaption?.trim()) {
      return NextResponse.json({ error: "baseCaption is required" }, { status: 400 });
    }

    const experiment = await createExperiment({
      channel: body.channel,
      pageId: body.pageId,
      topic: body.topic,
      baseCaption: body.baseCaption,
      variantB: body.variantB,
    });

    return NextResponse.json({ experiment });
  }

  if (body.action === "track") {
    const updated = await updateExperimentMetrics({
      experimentId: body.experimentId,
      variant: body.variant,
      impressions: body.impressions,
      engagements: body.engagements,
    });

    if (!updated) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    return NextResponse.json({ experiment: updated });
  }

  if (body.action === "evaluate") {
    const evaluated = await evaluateExperiment(body.experimentId);
    if (!evaluated) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    return NextResponse.json({ experiment: evaluated });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
