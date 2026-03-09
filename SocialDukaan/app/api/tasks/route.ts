import { NextResponse } from "next/server";
import { loadTokens } from "@/lib/token-store";
import { listCompetitors } from "@/lib/competitor-store";
import { ensureAutopilotState } from "@/lib/autopilot-store";
import { publishToChannels } from "@/lib/social-publisher";
import { resolveAutopilotImageUrl } from "@/lib/autopilot-image";
import {
  deleteWeeklyTask,
  listWeeklyTasks,
  updateWeeklyTask,
  upsertWeeklyTasks,
  type WeeklyContentTask,
} from "@/lib/task-folder-store";
import { getUserIdFromRequest } from "@/lib/user-session";

interface GeneratePayload {
  action?: "generate";
  pageId?: string;
  days?: number;
  channels?: Array<"instagram" | "facebook">;
  campaignTopic?: string;
}

interface TaskActionPayload {
  action?: "approve" | "autopost" | "approve_all" | "autopost_all" | "reject" | "delete" | "delete_many";
  taskId?: string;
  taskIds?: string[];
}

type TaskPayload = GeneratePayload | TaskActionPayload;

function toAccountHandle(pageName: string): string {
  return `@${pageName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "account"}`;
}

function buildWeeklyCaption(input: {
  topic: string;
  competitorHandle: string;
  channel: "instagram" | "facebook";
}): string {
  const base = `Weekly plan: ${input.topic}.`;
  const channelHint =
    input.channel === "instagram"
      ? "Use a visual-first hook, concise value, and a strong CTA."
      : "Use narrative context, clear value, and a community CTA.";

  return `${base}\n\nInspired by ${input.competitorHandle} signals. ${channelHint}\n\n#socialmedia #marketing #growth`;
}

function nextDateAtHour(offsetDays: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function normalizeChannels(
  requested: Array<"instagram" | "facebook"> | undefined,
  hasInstagram: boolean
): Array<"instagram" | "facebook"> {
  const allowed: Array<"instagram" | "facebook"> = hasInstagram
    ? ["facebook", "instagram"]
    : ["facebook"];

  if (!requested || requested.length === 0) return allowed;
  return requested.filter((channel) => allowed.includes(channel));
}

async function autopostSingleTask(task: WeeklyContentTask, userId: string) {
  const tokens = await loadTokens(userId);
  if (!tokens) {
    return { success: false as const, error: "Connect social accounts first." };
  }

  const result = await publishToChannels({
    tokens,
    pageId: task.pageId,
    channels: [task.channel],
    caption: task.caption,
    imageUrl: resolveAutopilotImageUrl({
      preferredUrl: task.imageUrl,
      topic: task.research?.inferredTopic || task.caption,
      competitorHint: task.competitorHandle,
      caption: task.caption,
      channel: task.channel,
      seed: task.id,
    }),
  });

  const channelResult = result[task.channel];
  if (!channelResult?.success) {
    const failed = await updateWeeklyTask(task.id, {
      status: "upcoming",
      error: channelResult?.error ?? "Autopost failed",
    }, userId);

    return {
      success: false as const,
      error: channelResult?.error ?? "Autopost failed",
      task: failed,
    };
  }

  const posted = await updateWeeklyTask(task.id, {
    status: "posted",
    postedAt: new Date().toISOString(),
    error: undefined,
  }, userId);

  return {
    success: true as const,
    task: posted,
    result: channelResult,
  };
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab");

  const all = await listWeeklyTasks(userId);
  const tasks =
    tab === "review" || tab === "upcoming" || tab === "posted" || tab === "rejected"
      ? all.filter((task) => task.status === tab)
      : all;

  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  const body = (await request.json()) as TaskPayload;

  if (body.action === "generate") {
    const tokens = await loadTokens(userId);
    if (!tokens) {
      return NextResponse.json({ error: "Connect social accounts first." }, { status: 401 });
    }

    const autopilot = await ensureAutopilotState(undefined, userId);
    const competitors = await listCompetitors(userId);
    const competitorPool = competitors.some((item) => !item.isSeed)
      ? competitors.filter((item) => !item.isSeed)
      : competitors;

    const selectedPageId = body.pageId ?? autopilot.selectedPageId ?? tokens.pages[0]?.id;
    const selectedPage = tokens.pages.find((page) => page.id === selectedPageId);

    if (!selectedPage) {
      return NextResponse.json({ error: "Select a valid page before generating tasks." }, { status: 400 });
    }

    const hasInstagramForPage = tokens.instagramAccounts.some((item) => item.pageId === selectedPage.id);
    const channels = normalizeChannels(body.channels, hasInstagramForPage);

    if (channels.length === 0) {
      return NextResponse.json({ error: "No supported channels available for this page." }, { status: 400 });
    }

    const topic = body.campaignTopic?.trim() || autopilot.campaignTopic?.trim() || "weekly social growth updates";
    const days = Math.min(Math.max(body.days ?? 7, 1), 7);

    const generated: WeeklyContentTask[] = [];
    for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
        const channel = channels[channelIndex];
        const competitor = competitorPool[(dayIndex + channelIndex) % Math.max(competitorPool.length, 1)];
        const competitorHandle = competitor?.handle ?? "@marketleader";

        generated.push({
          id: `task-${Date.now()}-${dayIndex}-${channelIndex}`,
          channel,
          pageId: selectedPage.id,
          pageName: selectedPage.name,
          accountHandle: toAccountHandle(selectedPage.name),
          competitorHandle,
          caption: buildWeeklyCaption({
            topic,
            competitorHandle,
            channel,
          }),
          research: {
            title: `Weekly strategy: ${topic}`,
            summary: `Generated from competitor signal ${competitorHandle} and campaign topic.`,
            inferredTopic: topic,
            basedOn: ["competitor_signal", "campaign_topic"],
          },
          imageUrl: resolveAutopilotImageUrl({
            preferredUrl: autopilot.imageUrl,
            topic,
            competitorHint: competitorHandle,
            channel,
            seed: `${selectedPage.id}-${dayIndex}-${channelIndex}`,
          }),
          scheduledAt: nextDateAtHour(dayIndex, channel === "instagram" ? 10 : 14),
          status: "review",
          createdAt: new Date().toISOString(),
        });
      }
    }

    await upsertWeeklyTasks(generated, userId);
    return NextResponse.json({ created: generated.length, tasks: generated });
  }

  if (body.action === "approve") {
    if (!body.taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const updated = await updateWeeklyTask(body.taskId, {
      status: "upcoming",
      error: undefined,
    }, userId);

    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task: updated });
  }

  if (body.action === "autopost") {
    if (!body.taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const tasks = await listWeeklyTasks(userId);
    const task = tasks.find((item) => item.id === body.taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const postResult = await autopostSingleTask(task, userId);
    if (!postResult.success) {
      return NextResponse.json(
        {
          error: postResult.error ?? "Autopost failed",
          task: postResult.task,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: postResult.task, result: postResult.result });
  }

  if (body.action === "reject") {
    if (!body.taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const updated = await updateWeeklyTask(body.taskId, {
      status: "rejected",
      error: undefined,
    }, userId);

    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task: updated });
  }

  if (body.action === "delete") {
    if (!body.taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const removed = await deleteWeeklyTask(body.taskId, userId);
    if (!removed) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, taskId: body.taskId });
  }

  if (body.action === "delete_many") {
    const ids = (body.taskIds ?? []).filter((id): id is string => typeof id === "string" && id.trim().length > 0);
    if (ids.length === 0) {
      return NextResponse.json({ error: "taskIds is required" }, { status: 400 });
    }

    let deleted = 0;
    for (const id of ids) {
      const removed = await deleteWeeklyTask(id, userId);
      if (removed) deleted += 1;
    }

    return NextResponse.json({
      requested: ids.length,
      deleted,
    });
  }

  if (body.action === "approve_all") {
    const all = await listWeeklyTasks(userId);
    const reviewTasks = all.filter((task) => task.status === "review");

    const updated = await Promise.all(
      reviewTasks.map((task) =>
        updateWeeklyTask(task.id, {
          status: "upcoming",
          error: undefined,
        }, userId)
      )
    );

    return NextResponse.json({
      approved: updated.filter(Boolean).length,
    });
  }

  if (body.action === "autopost_all") {
    const all = await listWeeklyTasks(userId);
    const candidates = all.filter((task) => task.status === "upcoming" || task.status === "review");

    let posted = 0;
    let failed = 0;
    const errors: Array<{ taskId: string; error: string }> = [];

    for (const task of candidates) {
      if (task.status === "review") {
        await updateWeeklyTask(task.id, { status: "upcoming", error: undefined }, userId);
      }

      const result = await autopostSingleTask({ ...task, status: "upcoming" }, userId);
      if (result.success) posted += 1;
      else {
        failed += 1;
        errors.push({ taskId: task.id, error: result.error ?? "Autopost failed" });
      }
    }

    return NextResponse.json({
      attempted: candidates.length,
      posted,
      failed,
      errors: errors.slice(0, 10),
    });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
