"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/layout/top-nav";

interface SettingsProfile {
  businessName: string;
}

interface SettingsAccounts {
  linkedin?: {
    profile?: { email?: string };
  };
}

interface PricingPlan {
  id: "starter" | "growth" | "pro";
  name: string;
  amountInr: number;
  features: string[];
}

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan["id"]>("starter");
  const [upiId, setUpiId] = useState("socialdukaan@okaxis");
  const [upiIntent, setUpiIntent] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/onboarding", { cache: "no-store" }).then((res) => res.json()),
      fetch("/api/auth/accounts", { cache: "no-store" }).then((res) => res.json()),
    ])
      .then(([onboardingData, accountsData]: [{ profile?: SettingsProfile }, SettingsAccounts]) => {
        setDisplayName(onboardingData?.profile?.businessName?.trim() ?? "");
        setEmail(accountsData?.linkedin?.profile?.email?.trim() ?? "");
      })
      .catch(() => {
        // Keep fields empty for direct user input when data is unavailable.
      });
  }, []);

  useEffect(() => {
    fetch("/api/pricing/plans", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setPlans(Array.isArray(data?.plans) ? (data.plans as PricingPlan[]) : []);
      })
      .catch(() => setPlans([]));
  }, []);

  const createUpiCheckout = async () => {
    setPaymentMessage("");
    setUpiIntent("");

    try {
      const response = await fetch("/api/payments/upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          upiId,
          businessName: displayName || "SocialDukaan",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPaymentMessage(data.error || "Could not generate UPI checkout.");
        return;
      }

      setUpiIntent(data.upiIntent || "");
      setPaymentMessage(data.message || "UPI checkout generated.");
    } catch {
      setPaymentMessage("Could not generate UPI checkout.");
    }
  };

  return (
    <>
      <TopNav title="Settings" />
      <div className="space-y-6 p-6">
        {/* Profile */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Display Name</label>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Connected Accounts</h2>
          <p className="mb-4 text-sm text-gray-500">Manage your connected social media accounts.</p>
          <a href="/dashboard/onboarding" className="btn-primary text-sm px-5 py-2.5">
            Manage Connections
          </a>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Notifications</h2>
          <div className="space-y-3">
            {[
              { label: "Post published successfully", defaultChecked: true },
              { label: "Autopilot actions", defaultChecked: true },
              { label: "Competitor activity alerts", defaultChecked: false },
              { label: "Weekly performance digest", defaultChecked: true }
            ].map((item) => (
              <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={item.defaultChecked}
                  className="h-4 w-4 rounded border-gray-300 text-sun-500 accent-sun-500"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-4">India Pricing & UPI Checkout</h2>
          <p className="mb-3 text-sm text-gray-500">Pay in INR and complete subscription via UPI.</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`rounded-xl border p-3 text-left ${selectedPlan === plan.id ? "border-sun-400 bg-sun-50" : "border-gray-200 bg-white"}`}
              >
                <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                <p className="mt-1 text-lg font-bold text-sun-600">INR {plan.amountInr}/mo</p>
                <p className="mt-1 text-xs text-gray-500">{plan.features[0]}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className="input"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="merchant@upi"
            />
            <button onClick={createUpiCheckout} className="btn-primary px-5 py-2.5 text-sm">
              Generate UPI Checkout
            </button>
          </div>

          {paymentMessage ? <p className="mt-2 text-xs text-gray-600">{paymentMessage}</p> : null}
          {upiIntent ? (
            <a href={upiIntent} className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Pay via UPI App
            </a>
          ) : null}
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200 p-6">
          <h2 className="section-title mb-2 text-red-600">Danger Zone</h2>
          <p className="mb-4 text-sm text-gray-500">
            Permanently delete your account and all associated data.
          </p>
          <button className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">
            Delete Account
          </button>
        </div>
      </div>
    </>
  );
}
