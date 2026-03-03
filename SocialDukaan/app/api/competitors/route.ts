import { NextResponse } from "next/server";
import { addCompetitor, listCompetitors, removeCompetitor } from "@/lib/competitor-store";
import type { Channel } from "@/lib/types";

interface AddCompetitorPayload {
  handle?: string;
  channel?: Channel;
}

export async function GET() {
  const competitors = await listCompetitors();
  return NextResponse.json({ competitors });
}

export async function POST(request: Request) {
  const body = (await request.json()) as AddCompetitorPayload;

  if (!body.handle?.trim() || !body.channel) {
    return NextResponse.json({ error: "handle and channel are required" }, { status: 400 });
  }

  const competitor = await addCompetitor({
    handle: body.handle.trim(),
    channel: body.channel,
  });

  return NextResponse.json({ competitor });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const removed = await removeCompetitor(id);
  if (!removed) {
    return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  }

  return NextResponse.json({ removed: true });
}
