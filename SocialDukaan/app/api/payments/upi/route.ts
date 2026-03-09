import { NextResponse } from "next/server";
import {
  createUpiOrder,
  listUpiOrders,
  verifyAndCompletePayment,
  getOrder,
  isRazorpayConfigured,
  type PricingPlan,
} from "@/lib/payments-store";
import { getUserIdFromRequest } from "@/lib/user-session";

interface UpiPayload {
  action?: "create" | "verify" | "status";
  planId?: PricingPlan["id"];
  upiId?: string;
  businessName?: string;
  // For payment verification
  orderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  if (orderId) {
    const order = await getOrder(orderId, userId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  }

  const orders = await listUpiOrders(userId);
  return NextResponse.json({
    orders,
    razorpayConfigured: isRazorpayConfigured(),
  });
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = (await request.json()) as UpiPayload;

    // Verify a completed payment
    if (body.action === "verify") {
      if (!body.orderId || !body.razorpayPaymentId || !body.razorpaySignature) {
        return NextResponse.json(
          { error: "orderId, razorpayPaymentId, and razorpaySignature are required" },
          { status: 400 }
        );
      }

      const order = await verifyAndCompletePayment({
        orderId: body.orderId,
        razorpayPaymentId: body.razorpayPaymentId,
        razorpaySignature: body.razorpaySignature,
      }, userId);

      if (!order) {
        return NextResponse.json({ error: "Order not found or already processed" }, { status: 404 });
      }

      if (order.status === "paid") {
        return NextResponse.json({
          order,
          message: "Payment verified successfully! Your subscription is now active.",
          success: true,
        });
      }

      return NextResponse.json({
        order,
        message: order.status === "expired" ? "Payment link expired." : "Payment verification failed.",
        success: false,
      }, { status: 400 });
    }

    // Create a new order
    if (!body.planId || !body.upiId?.trim()) {
      return NextResponse.json({ error: "planId and upiId are required" }, { status: 400 });
    }

    const order = await createUpiOrder({
      planId: body.planId,
      upiId: body.upiId.trim(),
      businessName: body.businessName || "SocialDukaan",
    }, userId);

    const note = `SocialDukaan ${order.planId} subscription`;

    // UPI intent URL (direct UPI app flow)
    const upiIntent = `upi://pay?pa=${encodeURIComponent(order.upiId)}&pn=${encodeURIComponent(order.businessName)}&am=${order.totalAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

    return NextResponse.json({
      order,
      upiIntent,
      razorpayConfigured: isRazorpayConfigured(),
      razorpayKeyId: order.razorpayKeyId,
      razorpayOrderId: order.razorpayOrderId,
      qrHint: `Pay ₹${order.totalAmount} (₹${order.amountInr} + ₹${order.gstAmount} GST) via UPI to ${order.upiId}`,
      message: order.razorpayOrderId
        ? "Razorpay order created. Use Razorpay Checkout to complete payment."
        : "UPI checkout generated. Complete payment in your UPI app.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate UPI checkout" },
      { status: 500 }
    );
  }
}
