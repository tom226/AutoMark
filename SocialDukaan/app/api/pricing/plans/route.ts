import { NextResponse } from "next/server";
import { INDIA_PRICING_PLANS, isRazorpayConfigured } from "@/lib/payments-store";

export async function GET() {
  return NextResponse.json({
    currency: "INR",
    gstPercent: 18,
    paymentMethods: isRazorpayConfigured()
      ? ["UPI", "Razorpay (UPI, Cards, Netbanking, Wallets)"]
      : ["UPI"],
    razorpayConfigured: isRazorpayConfigured(),
    plans: INDIA_PRICING_PLANS,
  });
}
