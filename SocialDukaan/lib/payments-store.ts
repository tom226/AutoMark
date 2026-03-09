import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";
import crypto from "crypto";

export interface PricingPlan {
  id: "starter" | "growth" | "pro";
  name: string;
  amountInr: number;
  interval: "monthly";
  features: string[];
  gstPercent: number;
  totalWithGst: number;
}

export interface UpiPaymentOrder {
  id: string;
  planId: PricingPlan["id"];
  amountInr: number;
  gstAmount: number;
  totalAmount: number;
  upiId: string;
  businessName: string;
  status: "pending" | "paid" | "failed" | "expired";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
}

interface PaymentState {
  orders: UpiPaymentOrder[];
  updatedAt: string;
}

const GST_PERCENT = 18;

export const INDIA_PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter India",
    amountInr: 299,
    interval: "monthly",
    features: ["3 social channels", "India festival reminders", "Basic AI compose", "Email support"],
    gstPercent: GST_PERCENT,
    totalWithGst: Math.round(299 * (1 + GST_PERCENT / 100)),
  },
  {
    id: "growth",
    name: "Growth India",
    amountInr: 699,
    interval: "monthly",
    features: [
      "10 social channels",
      "Hindi + regional compose (11 languages)",
      "Competitor tracking incl. ShareChat/Moj/Josh",
      "WhatsApp broadcast scheduling",
      "Priority support",
    ],
    gstPercent: GST_PERCENT,
    totalWithGst: Math.round(699 * (1 + GST_PERCENT / 100)),
  },
  {
    id: "pro",
    name: "Pro Bharat",
    amountInr: 1499,
    interval: "monthly",
    features: [
      "Unlimited channels",
      "WhatsApp broadcast + Cloud API sending",
      "Advanced analytics + autopilot",
      "AI content calendar",
      "Dedicated account manager",
    ],
    gstPercent: GST_PERCENT,
    totalWithGst: Math.round(1499 * (1 + GST_PERCENT / 100)),
  },
];

const PAYMENT_FILE = "tasks/upi-payments.json";
const PAYMENT_KEY = "socialdukaan:upi-payments";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

async function loadState(userId = "anon"): Promise<PaymentState> {
  const key = userScopedKey(PAYMENT_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(PAYMENT_FILE, userId));
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<PaymentState>(key);
    if (fromRedis) return fromRedis;
    const empty = { orders: [], updatedAt: new Date().toISOString() };
    await redisSetJson(key, empty);
    return empty;
  }

  const fromFile = await readFirstExistingJson<PaymentState>(files);
  if (fromFile) return fromFile;

  const empty = { orders: [], updatedAt: new Date().toISOString() };
  await writeJsonWithFallback(files, empty);
  return empty;
}

async function saveState(state: PaymentState, userId = "anon"): Promise<void> {
  const key = userScopedKey(PAYMENT_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(PAYMENT_FILE, userId));
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeJsonWithFallback(files, next);
}

/** Check if Razorpay gateway is configured */
export function isRazorpayConfigured(): boolean {
  return !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

/** Create a Razorpay order via their API */
async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string>
): Promise<{ id: string; amount: number; currency: string } | null> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return null;

  try {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes,
        payment_capture: 1, // Auto-capture
      }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/** Verify Razorpay payment signature (HMAC SHA256) */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function createUpiOrder(input: {
  planId: PricingPlan["id"];
  upiId: string;
  businessName: string;
}, userId = "anon"): Promise<UpiPaymentOrder & { razorpayKeyId?: string }> {
  const plan = INDIA_PRICING_PLANS.find((item) => item.id === input.planId);
  if (!plan) throw new Error("Invalid plan selected");

  const state = await loadState(userId);
  const gstAmount = Math.round(plan.amountInr * GST_PERCENT / 100);
  const totalAmount = plan.amountInr + gstAmount;

  const order: UpiPaymentOrder = {
    id: `upi-${Date.now()}`,
    planId: plan.id,
    amountInr: plan.amountInr,
    gstAmount,
    totalAmount,
    upiId: input.upiId,
    businessName: input.businessName.trim() || "SocialDukaan",
    status: "pending",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
  };

  // Create Razorpay order if configured
  const rzpOrder = await createRazorpayOrder(
    totalAmount * 100, // paise
    order.id,
    { planId: plan.id, userId },
  );
  if (rzpOrder) {
    order.razorpayOrderId = rzpOrder.id;
  }

  state.orders.push(order);
  await saveState(state, userId);
  return { ...order, razorpayKeyId: RAZORPAY_KEY_ID || undefined };
}

export async function verifyAndCompletePayment(input: {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}, userId = "anon"): Promise<UpiPaymentOrder | null> {
  const state = await loadState(userId);
  const order = state.orders.find((o) => o.id === input.orderId);
  if (!order || order.status !== "pending") return null;

  // Check expiry
  if (new Date(order.expiresAt) < new Date()) {
    order.status = "expired";
    await saveState(state, userId);
    return order;
  }

  // Verify Razorpay signature if we have a Razorpay order
  if (order.razorpayOrderId) {
    const valid = verifyRazorpaySignature(
      order.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature
    );
    if (!valid) {
      order.status = "failed";
      await saveState(state, userId);
      return order;
    }
  }

  order.razorpayPaymentId = input.razorpayPaymentId;
  order.status = "paid";
  order.paidAt = new Date().toISOString();
  await saveState(state, userId);
  return order;
}

export async function listUpiOrders(userId = "anon"): Promise<UpiPaymentOrder[]> {
  const state = await loadState(userId);
  return [...state.orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getOrder(orderId: string, userId = "anon"): Promise<UpiPaymentOrder | null> {
  const state = await loadState(userId);
  return state.orders.find((o) => o.id === orderId) || null;
}
