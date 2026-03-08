"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Unlink,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Target,
  Globe,
  Store,
} from "lucide-react";
import { cn } from "@/lib/cn";

type PreferredLanguage = "english" | "hindi" | "hinglish";
type PrimaryObjective = "sales" | "followers" | "messages" | "awareness";

interface OnboardingProfile {
  businessName: string;
  businessType: string;
  niche: string;
  preferredLanguage: PreferredLanguage;
  postingGoal: number;
  primaryObjective: PrimaryObjective;
  timezone: string;
  onboardingCompleted: boolean;
  completedAt?: string;
  updatedAt?: string;
}

interface AccountsData {
  connected: boolean;
  connectedAt?: string;
  pages: { id: string; name: string }[];
  instagramAccounts: { igId: string; pageId: string; pageName: string }[];
  oauth?: {
    metaConfigured: boolean;
    linkedinConfigured: boolean;
    twitterConfigured: boolean;
  };
  linkedin?: {
    connected: boolean;
    connectedAt?: string;
    profile?: { id?: string; name?: string; email?: string; picture?: string };
  };
  twitter?: {
    connected: boolean;
    connectedAt?: string;
    profile?: { id?: string; username?: string; name?: string };
  };
}

const TOTAL_STEPS = 5;

const BUSINESS_TYPES = [
  "local shop",
  "service business",
  "coach/consultant",
  "creator/influencer",
  "agency",
  "restaurant/cafe",
  "e-commerce",
  "other",
];

const DEFAULT_PROFILE: OnboardingProfile = {
  businessName: "",
  businessType: "",
  niche: "",
  preferredLanguage: "english",
  postingGoal: 4,
  primaryObjective: "sales",
  timezone: "Asia/Kolkata",
  onboardingCompleted: false,
};

function stepTitle(step: number): string {
  if (step === 1) return "Tell us about your business";
  if (step === 2) return "Set your content preferences";
  if (step === 3) return "Choose your growth goal";
  if (step === 4) return "Connect your social accounts";
  return "Review and finish";
}

function stepDescription(step: number): string {
  if (step === 1) return "This helps us create relevant content for your audience.";
  if (step === 2) return "Pick language and weekly posting target.";
  if (step === 3) return "We will optimize suggestions based on this main goal.";
  if (step === 4) return "Connect at least one account to start posting.";
  return "Check everything and complete onboarding.";
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<OnboardingProfile>(DEFAULT_PROFILE);
  const [accounts, setAccounts] = useState<AccountsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [urlMsg, setUrlMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setUrlMsg({ type: "error", text: decodeURIComponent(params.get("error")!) });
      setStep(4);
    } else if (params.get("connected")) {
      const platform = params.get("connected");
      const msg =
        platform === "linkedin"
          ? "LinkedIn connected successfully!"
          : platform === "twitter"
            ? "Twitter/X connected successfully!"
            : "Facebook & Instagram connected successfully!";
      setUrlMsg({ type: "success", text: msg });
      setStep(4);
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profileRes, accountsRes] = await Promise.all([
        fetch("/api/onboarding", { cache: "no-store" }),
        fetch("/api/auth/accounts", { cache: "no-store" }),
      ]);
      const profileData = await profileRes.json();
      const accountsData = await accountsRes.json();

      if (profileData?.profile) {
        setProfile(profileData.profile as OnboardingProfile);
      }
      setAccounts(accountsData as AccountsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const anyConnected = useMemo(() => {
    return Boolean(
      (accounts?.pages?.length ?? 0) > 0 ||
        (accounts?.instagramAccounts?.length ?? 0) > 0 ||
        accounts?.linkedin?.connected ||
        accounts?.twitter?.connected,
    );
  }, [accounts]);

  const anyProviderConfigured = useMemo(() => {
    if (!accounts?.oauth) return true;
    return Boolean(
      accounts.oauth.metaConfigured ||
        accounts.oauth.linkedinConfigured ||
        accounts.oauth.twitterConfigured,
    );
  }, [accounts]);

  const saveProfile = async (patch: Partial<OnboardingProfile>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, ...patch }),
      });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (res.ok && data.profile) {
        setProfile(data.profile as OnboardingProfile);
      } else {
        setUrlMsg({ type: "error", text: data.error ?? "Failed to save onboarding data." });
      }
    } catch {
      setUrlMsg({ type: "error", text: "Failed to save onboarding data." });
    } finally {
      setSaving(false);
    }
  };

  const validateCurrentStep = (): string | null => {
    if (step === 1) {
      if (!profile.businessType.trim()) return "Please select your business type.";
      if (!profile.niche.trim()) return "Please enter your niche (for example: bakery, fitness coach, salon).";
    }

    if (step === 2) {
      if (!profile.preferredLanguage) return "Please select your preferred language.";
      if (!profile.postingGoal || profile.postingGoal < 1) return "Please set a weekly posting goal.";
    }

    if (step === 3) {
      if (!profile.primaryObjective) return "Please select your main growth objective.";
    }

    if (step === 4) {
      if (!anyConnected && anyProviderConfigured) {
        return "Please connect at least one social account before continuing.";
      }
    }

    return null;
  };

  const nextStep = async () => {
    const validation = validateCurrentStep();
    if (validation) {
      setUrlMsg({ type: "error", text: validation });
      return;
    }

    setUrlMsg(null);
    await saveProfile({});
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  };

  const prevStep = () => {
    setUrlMsg(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const completeOnboarding = async () => {
    const validation = validateCurrentStep();
    if (validation) {
      setUrlMsg({ type: "error", text: validation });
      return;
    }

    await saveProfile({
      onboardingCompleted: true,
      completedAt: new Date().toISOString(),
    });

    setUrlMsg({ type: "success", text: "Onboarding completed. You are ready to create your first post." });
  };

  const disconnect = async () => {
    setDisconnecting(true);
    await fetch("/api/auth/accounts", { method: "DELETE" });
    setAccounts({
      connected: false,
      pages: [],
      instagramAccounts: [],
      linkedin: { connected: false },
      twitter: { connected: false },
    });
    setDisconnecting(false);
    setUrlMsg({ type: "success", text: "Accounts disconnected." });
  };

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <div className="rounded-2xl border border-page-border bg-white p-5 shadow-card">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sun-600">Step {step} of {TOTAL_STEPS}</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{stepTitle(step)}</h2>
            <p className="mt-1 text-sm text-gray-500">{stepDescription(step)}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-sun-50 px-3 py-1.5 text-xs font-semibold text-sun-700">
            <Rocket className="h-3.5 w-3.5" />
            {progressPercent}% complete
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-sun-500 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {urlMsg && (
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium",
            urlMsg.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {urlMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {urlMsg.text}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-sm text-gray-500">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading onboarding...
        </div>
      ) : (
        <>
          {step === 1 && (
            <div className="card space-y-5 p-6">
              <div>
                <label className="label">Business Name (optional)</label>
                <input
                  value={profile.businessName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, businessName: e.target.value }))}
                  placeholder="For example: Rahul Digital Studio"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Business Type</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setProfile((prev) => ({ ...prev, businessType: type }))}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm transition",
                        profile.businessType === type
                          ? "border-sun-400 bg-sun-50 text-sun-800"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <Store className="mr-2 inline h-3.5 w-3.5" />
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Niche</label>
                <input
                  value={profile.niche}
                  onChange={(e) => setProfile((prev) => ({ ...prev, niche: e.target.value }))}
                  placeholder="For example: Bakery, Fitness coaching, Salon, Real estate"
                  className="input"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card space-y-5 p-6">
              <div>
                <label className="label">Preferred Content Language</label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { key: "english", label: "English" },
                    { key: "hindi", label: "Hindi" },
                    { key: "hinglish", label: "Hinglish" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          preferredLanguage: item.key as PreferredLanguage,
                        }))
                      }
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm transition",
                        profile.preferredLanguage === item.key
                          ? "border-sun-400 bg-sun-50 text-sun-800"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <Globe className="mr-2 inline h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Posting Goal per Week</label>
                <input
                  type="number"
                  min={1}
                  max={21}
                  value={profile.postingGoal}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      postingGoal: Math.max(1, Math.min(21, Number(e.target.value || 1))),
                    }))
                  }
                  className="input max-w-[220px]"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Suggested for most businesses: 4 to 7 posts per week.
                </p>
              </div>

              <div>
                <label className="label">Timezone</label>
                <input
                  value={profile.timezone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="input max-w-[260px]"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card space-y-5 p-6">
              <div>
                <label className="label">Primary Growth Objective</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { key: "sales", label: "Get more sales" },
                    { key: "followers", label: "Grow followers" },
                    { key: "messages", label: "Get more messages/leads" },
                    { key: "awareness", label: "Increase brand awareness" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          primaryObjective: item.key as PrimaryObjective,
                        }))
                      }
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm transition",
                        profile.primaryObjective === item.key
                          ? "border-sun-400 bg-sun-50 text-sun-800"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <Target className="mr-2 inline h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-sun-200 bg-sun-50 p-4 text-sm text-sun-900">
                SocialDukaan will tune your captions, suggestions, and timing to prioritize this goal.
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="card p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                      <Facebook className="h-5 w-5 text-channel-facebook" />
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                      <Instagram className="h-5 w-5 text-channel-instagram" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Facebook & Instagram</p>
                    <p className="text-xs text-gray-400">One click connects both via Meta</p>
                  </div>
                </div>

                {accounts?.pages?.length || accounts?.instagramAccounts?.length ? (
                  <div className="space-y-3">
                    {accounts.pages.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Connected Facebook Pages</p>
                        {accounts.pages.map((p) => (
                          <div key={p.id} className="flex items-center gap-2 text-sm text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            {p.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {accounts.instagramAccounts.length > 0 && (
                      <div className="rounded-xl border border-pink-200 bg-pink-50 p-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-pink-700">Connected Instagram Accounts</p>
                        {accounts.instagramAccounts.map((ig) => (
                          <div key={ig.igId} className="flex items-center gap-2 text-sm text-pink-800">
                            <CheckCircle2 className="h-3.5 w-3.5 text-pink-500" />
                            {ig.pageName}
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={disconnect}
                      disabled={disconnecting}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-red-600"
                    >
                      {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
                      Disconnect accounts
                    </button>
                  </div>
                ) : (
                  <a href="/api/auth/meta" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
                    <Facebook className="h-4 w-4" />
                    Connect with Facebook
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-channel-linkedin" />
                      <p className="font-semibold text-gray-900">LinkedIn</p>
                    </div>
                    <span className={cn("badge", accounts?.linkedin?.connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      {accounts?.linkedin?.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  {accounts?.linkedin?.connected ? (
                    <p className="text-xs text-emerald-700">
                      Connected as {accounts.linkedin?.profile?.name || "LinkedIn account"}
                    </p>
                  ) : (
                    <a href="/api/auth/linkedin" className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-xs">
                      Connect LinkedIn <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </a>
                  )}
                </div>

                <div className="card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-gray-700" />
                      <p className="font-semibold text-gray-900">Twitter / X</p>
                    </div>
                    <span className={cn("badge", accounts?.twitter?.connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      {accounts?.twitter?.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  {accounts?.twitter?.connected ? (
                    <p className="text-xs text-emerald-700">
                      Connected as {accounts.twitter?.profile?.username ? `@${accounts.twitter.profile.username}` : "Twitter account"}
                    </p>
                  ) : (
                    <a href="/api/auth/twitter" className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-xs">
                      Connect Twitter / X <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    </a>
                  )}
                </div>
              </div>

              {!anyProviderConfigured && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  OAuth credentials are not configured in production yet. You can continue onboarding now and connect
                  accounts later from this step.
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="card space-y-5 p-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-semibold">You are almost done.</p>
                <p className="mt-1">Review your setup and complete onboarding.</p>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Business</p>
                  <p className="font-semibold text-gray-900">{profile.businessName || "Not provided"}</p>
                  <p className="text-gray-600">{profile.businessType || "Not selected"}</p>
                  <p className="text-gray-600">Niche: {profile.niche || "Not set"}</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Content Preferences</p>
                  <p className="text-gray-700">Language: {profile.preferredLanguage}</p>
                  <p className="text-gray-700">Goal/week: {profile.postingGoal}</p>
                  <p className="text-gray-700">Objective: {profile.primaryObjective}</p>
                </div>
              </div>

              <div className="rounded-xl border border-sun-200 bg-sun-50 p-4 text-sm text-sun-900">
                First action after finish:
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-sun-800">
                  <li>Open Compose.</li>
                  <li>Generate caption with AI.</li>
                  <li>Select channels and publish your first post.</li>
                </ol>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={completeOnboarding} disabled={saving} className="btn-primary px-6 py-2.5 text-sm">
                  {saving ? "Finishing..." : "Finish Onboarding"}
                </button>
                <Link href="/dashboard/compose" className="btn-outline px-5 py-2.5 text-sm">
                  Go to Compose
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={prevStep}
              disabled={step === 1 || saving}
              className="btn-ghost px-4 py-2 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {step < TOTAL_STEPS ? (
              <button onClick={nextStep} disabled={saving} className="btn-primary px-5 py-2.5 text-sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save & Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="text-xs text-gray-400">
                {profile.onboardingCompleted ? "Onboarding complete" : "Complete onboarding to continue"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
