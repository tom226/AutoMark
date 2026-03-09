import { NextResponse } from "next/server";
import { generateAutomatedPostPlan, type PostAutomationRequest } from "@/lib/post-automation-tool";
import { getUserIdFromRequest } from "@/lib/user-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PostAutomationRequest;
    const userId = getUserIdFromRequest(request);
    const result = await generateAutomatedPostPlan({ ...(body ?? {}), userId });

    return NextResponse.json({
      status: "ok",
      generated: result.generated,
      queueSaved: result.queueSaved,
      selectedPage: result.selectedPage,
      bestPracticesApplied: result.bestPracticesApplied,
      drafts: result.drafts,
      message:
        result.queueSaved > 0
          ? "Batch generated and saved to review queue."
          : "Batch generated. Review drafts before queueing or publishing.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate automated post plan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
