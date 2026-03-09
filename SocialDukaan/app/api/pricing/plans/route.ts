import { NextResponse } from "next/server";
import { INDIA_PRICING_PLANS } from "@/lib/payments-store";

export async function GET() {
  return NextResponse.json({
    currency: "INR",
    paymentMethods: ["UPI"],
    plans: INDIA_PRICING_PLANS,
  });
}
