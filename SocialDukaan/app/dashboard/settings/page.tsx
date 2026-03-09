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

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

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
