import { NextResponse } from "next/server";
import { addCompetitor, listCompetitors, removeCompetitor } from "@/lib/competitor-store";
import type { Channel } from "@/lib/types";
import { getUserIdFromRequest } from "@/lib/user-session";

interface AddCompetitorPayload {
  handle?: string;
  channel?: Channel;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const competitors = await listCompetitors(userId);
  return NextResponse.json({ competitors });
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  const body = (await request.json()) as AddCompetitorPayload;

  if (!body.handle?.trim() || !body.channel) {
    return NextResponse.json({ error: "handle and channel are required" }, { status: 400 });
  }

  const competitor = await addCompetitor({
    handle: body.handle.trim(),
    channel: body.channel,
  }, userId);

  return NextResponse.json({ competitor });
}

export async function DELETE(request: Request) {
  const userId = getUserIdFromRequest(request);
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const removed = await removeCompetitor(id, userId);
  if (!removed) {
    return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  }

  return NextResponse.json({ removed: true });
}
