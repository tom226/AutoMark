import { NextResponse } from "next/server";
import { ensureAutopilotState } from "@/lib/autopilot-store";

function getHourLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
}

export async function GET() {
  const state = await ensureAutopilotState();
  const posted = state.jobs.filter((job) => job.status === "posted");
  const failed = state.jobs.filter((job) => job.status === "failed");

  const totalAttempts = posted.length + failed.length;
  const successRate = totalAttempts === 0 ? 0 : Math.round((posted.length / totalAttempts) * 100);

  const byChannel = {
    instagram: {
      posted: posted.filter((job) => job.channel === "instagram").length,
      failed: failed.filter((job) => job.channel === "instagram").length,
    },
    facebook: {
      posted: posted.filter((job) => job.channel === "facebook").length,
      failed: failed.filter((job) => job.channel === "facebook").length,
    },
  };

  const postedByHour = new Map<string, number>();
  for (const job of posted) {
    const label = getHourLabel(job.runAtIso);
    postedByHour.set(label, (postedByHour.get(label) ?? 0) + 1);
  }

  const bestHour = Array.from(postedByHour.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

  const recommendations: string[] = [];
  if (totalAttempts === 0) {
    recommendations.push("Not enough data yet. Run autopilot for a few days to generate optimization insights.");
  } else {
    recommendations.push(`Current autonomous success rate is ${successRate}%.`);

    if (bestHour) {
      recommendations.push(`Best performing posting window so far: ${bestHour}.`);
    }

    if (byChannel.instagram.failed > byChannel.instagram.posted) {
      recommendations.push("Instagram has more failures than successes. Ensure selected page has a linked IG Business account and valid public image URLs.");
    }

    if (byChannel.facebook.posted >= byChannel.facebook.failed && byChannel.facebook.posted > 0) {
      recommendations.push("Facebook is stable. Keep it enabled as a fallback when Instagram fails.");
    }

    if (failed.length > posted.length) {
      recommendations.push("Failures exceed successful posts. Reduce posts per day by 1 for each enabled channel until stability improves.");
    }
  }

  return NextResponse.json({
    metrics: {
      totalAttempts,
      posted: posted.length,
      failed: failed.length,
      successRate,
      byChannel,
      bestHour: bestHour ?? null,
    },
    recommendations,
  });
}
