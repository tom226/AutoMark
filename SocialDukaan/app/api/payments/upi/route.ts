import { NextResponse } from "next/server";
import { createUpiOrder, listUpiOrders, type PricingPlan } from "@/lib/payments-store";
import { getUserIdFromRequest } from "@/lib/user-session";

interface UpiPayload {
  planId?: PricingPlan["id"];
  upiId?: string;
  businessName?: string;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const orders = await listUpiOrders(userId);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = (await request.json()) as UpiPayload;

    if (!body.planId || !body.upiId?.trim()) {
      return NextResponse.json({ error: "planId and upiId are required" }, { status: 400 });
    }

    const order = await createUpiOrder({
      planId: body.planId,
      upiId: body.upiId.trim(),
      businessName: body.businessName || "SocialDukaan",
    }, userId);

    const note = `SocialDukaan ${order.planId} subscription`;
    const upiIntent = `upi://pay?pa=${encodeURIComponent(order.upiId)}&pn=${encodeURIComponent(order.businessName)}&am=${order.amountInr}&cu=INR&tn=${encodeURIComponent(note)}`;

    return NextResponse.json({
      order,
      upiIntent,
      qrHint: `Use any UPI app and pay INR ${order.amountInr} to ${order.upiId}`,
      message: "UPI checkout generated. Complete payment in your UPI app.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate UPI checkout" },
      { status: 500 }
    );
  }
}
