import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export interface PricingPlan {
  id: "starter" | "growth" | "pro";
  name: string;
  amountInr: number;
  interval: "monthly";
  features: string[];
}

export interface UpiPaymentOrder {
  id: string;
  planId: PricingPlan["id"];
  amountInr: number;
  upiId: string;
  businessName: string;
  status: "pending" | "paid";
  createdAt: string;
}

interface PaymentState {
  orders: UpiPaymentOrder[];
  updatedAt: string;
}

export const INDIA_PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter India",
    amountInr: 299,
    interval: "monthly",
    features: ["3 social channels", "India festival reminders", "Basic AI compose"],
  },
  {
    id: "growth",
    name: "Growth India",
    amountInr: 699,
    interval: "monthly",
    features: ["10 social channels", "Hindi + regional compose", "Competitor tracking incl. ShareChat/Moj/Josh"],
  },
  {
    id: "pro",
    name: "Pro Bharat",
    amountInr: 1499,
    interval: "monthly",
    features: ["Unlimited channels", "WhatsApp broadcast scheduler", "Advanced analytics + autopilot"],
  },
];

const PAYMENT_FILE = "tasks/upi-payments.json";
const PAYMENT_KEY = "socialdukaan:upi-payments";

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

export async function createUpiOrder(input: {
  planId: PricingPlan["id"];
  upiId: string;
  businessName: string;
}, userId = "anon"): Promise<UpiPaymentOrder> {
  const plan = INDIA_PRICING_PLANS.find((item) => item.id === input.planId);
  if (!plan) throw new Error("Invalid plan selected");

  const state = await loadState(userId);
  const order: UpiPaymentOrder = {
    id: `upi-${Date.now()}`,
    planId: plan.id,
    amountInr: plan.amountInr,
    upiId: input.upiId,
    businessName: input.businessName.trim() || "SocialDukaan",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  state.orders.push(order);
  await saveState(state, userId);
  return order;
}

export async function listUpiOrders(userId = "anon"): Promise<UpiPaymentOrder[]> {
  const state = await loadState(userId);
  return [...state.orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
