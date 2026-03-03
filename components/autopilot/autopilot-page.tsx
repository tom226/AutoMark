"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Bot,
  Sparkles,
  Clock,
  CheckCircle2,
  Search,
  Send,
  Save,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { AutopilotRule, Channel } from "@/lib/types";

interface AccountsData {
  connected: boolean;
  pages: { id: string; name: string }[];
  instagramAccounts: { igId: string; pageId: string; pageName: string }[];
}

interface QueueStats {
  total: number;
  pending: number;
  posted: number;
  failed: number;
}

interface OptimizationMetrics {
  totalAttempts: number;
  posted: number;
  failed: number;
  successRate: number;
  bestHour: string | null;
}

/* ── channel helpers ─────────────────────────────────────── */

const channelMeta: Record<
  Channel,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  instagram: {
    label: "Instagram",
    icon: Instagram,
    color: "text-channel-instagram",
    bg: "bg-pink-50",
  },
  facebook: {
    label: "Facebook",
    icon: Facebook,
    color: "text-channel-facebook",
    bg: "bg-blue-50",
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-channel-linkedin",
    bg: "bg-sky-50",
  },
  twitter: {
    label: "Twitter",
    icon: Twitter,
    color: "text-channel-twitter",
    bg: "bg-cyan-50",
  },
};

const tones: AutopilotRule["tone"][] = [
  "professional",
  "casual",
  "witty",
  "inspirational",
];

/* ── seed rules ──────────────────────────────────────────── */

const seedRules: AutopilotRule[] = [
  {
    id: "r1",
    channel: "instagram",
    enabled: true,
    postsPerDay: 2,
    bestTimeSlots: ["10:00 AM", "2:00 PM", "6:00 PM"],
    competitorId: "c1",
    tone: "casual",
  },
  {
    id: "r2",
    channel: "facebook",
    enabled: false,
    postsPerDay: 1,
    bestTimeSlots: ["10:00 AM", "2:00 PM"],
    tone: "professional",
  },
  {
    id: "r3",
    channel: "linkedin",
    enabled: true,
    postsPerDay: 1,
    bestTimeSlots: ["10:00 AM", "6:00 PM"],
    competitorId: "c2",
    tone: "professional",
  },
  {
    id: "r4",
    channel: "twitter",
    enabled: false,
    postsPerDay: 3,
    bestTimeSlots: ["10:00 AM", "2:00 PM", "6:00 PM"],
    tone: "witty",
  },
];

/* ── activity timeline ───────────────────────────────────── */

const activityLog = [
  {
    text: "AI generated post for Instagram",
    time: "2 hours ago",
    dot: "bg-sun-500",
    icon: Sparkles,
  },
  {
    text: "Scheduled post for LinkedIn",
    time: "5 hours ago",
    dot: "bg-channel-linkedin",
    icon: Clock,
  },
  {
    text: "Analyzed competitor @marketingpro",
    time: "8 hours ago",
    dot: "bg-green-500",
    icon: Search,
  },
  {
    text: "Published post to Twitter",
    time: "1 day ago",
    dot: "bg-channel-twitter",
    icon: Send,
  },
];

/* ── linked competitor labels ─────────────────────────────── */

const competitorLabels: Record<string, string> = {
  c1: "@marketingpro",
  c2: "@bizhacks",
  c3: "@trendsettr",
};

/* ── component ────────────────────────────────────────────── */

export default function AutopilotPage() {
  const [rules, setRules] = useState<AutopilotRule[]>(seedRules);
  const [saved, setSaved] = useState(false);
  const [accounts, setAccounts] = useState<AccountsData | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [campaignTopic, setCampaignTopic] = useState("");
  const [running, setRunning] = useState(false);
  const [runSummary, setRunSummary] = useState("");
  const [runError, setRunError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [lastProcessSummary, setLastProcessSummary] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationMetrics, setOptimizationMetrics] = useState<OptimizationMetrics | null>(null);
  const [optimizationTips, setOptimizationTips] = useState<string[]>([]);

  const updateRule = (id: string, patch: Partial<AutopilotRule>) =>
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );

  const handleSave = async () => {
    if (!selectedPageId) {
      setRunError("Please select a page before saving autopilot settings.");
      return;
    }

    setSavingSettings(true);
    try {
      const response = await fetch("/api/autopilot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedPageId,
          imageUrl: imageUrl.trim() || undefined,
          campaignTopic: campaignTopic.trim() || undefined,
          rules,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setRunError(data.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setRunError("Failed to save settings. Please try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/accounts")
      .then((response) => response.json())
      .then((data: AccountsData) => {
        setAccounts(data);
        if (data.pages?.[0]?.id) {
          setSelectedPageId((prev) => prev || data.pages[0].id);
        }
      })
      .finally(() => setAccountsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/autopilot/settings")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.rules) && data.rules.length > 0) {
          setRules(data.rules as AutopilotRule[]);
        }
        if (typeof data.selectedPageId === "string" && data.selectedPageId) {
          setSelectedPageId(data.selectedPageId);
        }
        if (typeof data.imageUrl === "string") {
          setImageUrl(data.imageUrl);
        }
        if (typeof data.campaignTopic === "string") {
          setCampaignTopic(data.campaignTopic);
        }
      })
      .catch(() => {
        // keep UI defaults
      });
  }, []);

  const processQueue = async () => {
    setProcessingQueue(true);
    setRunError("");
    try {
      const response = await fetch("/api/autopilot/process", { method: "POST" });
      const data = await response.json();
      if (data.error) {
        setRunError(data.error);
      } else {
        setQueueStats(data.queue ?? null);
        setLastProcessSummary(
          `Processed: ${data.processed ?? 0}, Posted: ${data.posted ?? 0}, Failed: ${data.failed ?? 0}, Retrying: ${data.retried ?? 0}`
        );
      }
    } catch {
      setRunError("Queue processing failed. Please try again.");
    } finally {
      setProcessingQueue(false);
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      fetch("/api/autopilot/process", { method: "POST" })
        .then((response) => response.json())
        .then((data) => {
          if (!data.error && data.queue) {
            setQueueStats(data.queue as QueueStats);
          }
        })
        .catch(() => {
          // best-effort scheduler tick while dashboard is open
        });
    }, 60_000);

    return () => window.clearInterval(id);
  }, []);

  const loadOptimization = async () => {
    setOptimizing(true);
    try {
      const response = await fetch("/api/autopilot/optimize");
      const data = await response.json();
      setOptimizationMetrics(data.metrics ?? null);
      setOptimizationTips(Array.isArray(data.recommendations) ? data.recommendations : []);
    } catch {
      setRunError("Failed to load optimization insights.");
    } finally {
      setOptimizing(false);
    }
  };

  const supportedEnabledChannels = useMemo(
    () =>
      rules
        .filter((rule) => rule.enabled && (rule.channel === "facebook" || rule.channel === "instagram"))
        .map((rule) => rule.channel),
    [rules]
  );

  const primaryTone = useMemo(
    () => rules.find((rule) => rule.enabled)?.tone ?? "professional",
    [rules]
  );

  const competitorHint = useMemo(() => {
    const firstLinked = rules.find((rule) => rule.enabled && rule.competitorId)?.competitorId;
    return firstLinked ? competitorLabels[firstLinked] : undefined;
  }, [rules]);

  const runAutopilotNow = async () => {
    setRunError("");
    setRunSummary("");

    if (!selectedPageId) {
      setRunError("Please select a page to post from.");
      return;
    }

    if (supportedEnabledChannels.length === 0) {
      setRunError("Enable Instagram and/or Facebook rule to generate autopilot queue.");
      return;
    }

    setRunning(true);
    try {
      const response = await fetch("/api/autopilot/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels: supportedEnabledChannels,
          pageId: selectedPageId,
          imageUrl: imageUrl.trim() || undefined,
          campaignTopic: campaignTopic.trim() || undefined,
          tone: primaryTone,
          competitorHint,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setRunError(data.error);
      } else {
        setRunSummary(`Generated ${data.created ?? 0} researched posts in Review queue. Nothing posted directly.`);
      }
    } catch {
      setRunError("Failed to generate autopilot queue. Please check your network and try again.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ── Hero Banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sun-400 to-orange-500 px-8 py-10 text-white shadow-lg">
        <Bot className="absolute -right-4 -top-4 h-32 w-32 rotate-12 opacity-10" />
        <h2 className="text-2xl font-bold">Let AI post for you</h2>
        <p className="mt-2 max-w-lg text-sm text-white/90">
          Autopilot studies competitor momentum and generates reviewed queue-ready content before any posting.
        </p>
      </div>

      {/* ── Channel Rules ────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="section-title">Channel Rules</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {rules.map((rule) => {
            const meta = channelMeta[rule.channel];
            const Icon = meta.icon;

            return (
              <div key={rule.id} className="card space-y-4 p-5">
                {/* Header: icon + name + toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        meta.bg
                      )}
                    >
                      <Icon className={cn("h-5 w-5", meta.color)} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {meta.label}
                    </span>
                  </div>

                  {/* Toggle switch */}
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) =>
                        updateRule(rule.id, { enabled: e.target.checked })
                      }
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-sun-500 peer-checked:after:translate-x-full" />
                  </label>
                </div>

                {/* Posts per day */}
                <div>
                  <label className="label">Posts per day</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={rule.postsPerDay}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        postsPerDay: Math.min(
                          5,
                          Math.max(1, Number(e.target.value))
                        ),
                      })
                    }
                    disabled={!rule.enabled}
                    className={cn("input w-24", !rule.enabled && "opacity-50")}
                  />
                </div>

                {/* Tone */}
                <div>
                  <label className="label">Tone</label>
                  <select
                    value={rule.tone}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        tone: e.target.value as AutopilotRule["tone"],
                      })
                    }
                    disabled={!rule.enabled}
                    className={cn("input", !rule.enabled && "opacity-50")}
                  >
                    {tones.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Best time slots */}
                <div>
                  <label className="label">Best time slots</label>
                  <div className="flex flex-wrap gap-1.5">
                    {rule.bestTimeSlots.map((slot) => (
                      <span
                        key={slot}
                        className="badge bg-sun-50 text-sun-700"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Linked competitor */}
                <div className="text-xs text-gray-500">
                  Linked competitor:{" "}
                  <span className="font-medium text-gray-700">
                    {rule.competitorId
                      ? competitorLabels[rule.competitorId] ?? rule.competitorId
                      : "None"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Generate Autopilot Queue ─────────────────────────── */}
      <section className="card space-y-4 p-6">
        <h3 className="section-title">Generate Autopilot Queue</h3>

        <div className="space-y-2">
          <label className="label">Page to post from</label>
          <div className="relative">
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              disabled={accountsLoading || !accounts?.connected || (accounts.pages?.length ?? 0) === 0}
              className="input w-full appearance-none pr-10"
            >
              {accountsLoading && <option value="">Loading pages…</option>}
              {!accountsLoading && (accounts?.pages?.length ?? 0) === 0 && <option value="">No connected pages</option>}
              {(accounts?.pages ?? []).map((page) => (
                <option key={page.id} value={page.id}>{page.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="label">Campaign topic (must guide competitor research)</label>
          <input
            type="text"
            value={campaignTopic}
            onChange={(e) => setCampaignTopic(e.target.value)}
            placeholder="e.g. Upcoming Running Events In Delhi NCR"
            className="input w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="label">Public image URL (optional)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="input w-full"
          />
          <p className="text-xs text-gray-500">
            If left blank, a public image URL is auto-generated from competitor and campaign topic context.
          </p>
        </div>

        <p className="text-xs text-gray-500">
          Enabled channels for queue generation: {supportedEnabledChannels.length > 0 ? supportedEnabledChannels.join(", ") : "none"}
        </p>

        <p className="text-xs text-gray-500">
          This action generates at least 7 researched posts in the Review queue first. It does not publish directly.
        </p>

        {runError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mr-1 inline h-4 w-4" /> {runError}
          </div>
        )}

        {runSummary && (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {runSummary}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={runAutopilotNow}
            disabled={running || !selectedPageId || supportedEnabledChannels.length === 0}
            className="btn-primary"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Generate 7+ Queue Posts
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={processQueue}
            disabled={processingQueue}
            className="btn-outline"
          >
            {processingQueue ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Queue…
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Process Due Queue
              </>
            )}
          </button>
        </div>

        {(queueStats || lastProcessSummary) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-700">
            {lastProcessSummary && <p>{lastProcessSummary}</p>}
            {queueStats && (
              <p>
                Queue → total: {queueStats.total}, pending: {queueStats.pending}, posted: {queueStats.posted}, failed: {queueStats.failed}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={loadOptimization} disabled={optimizing} className="btn-outline">
            {optimizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Optimize Autopilot
              </>
            )}
          </button>
        </div>

        {(optimizationMetrics || optimizationTips.length > 0) && (
          <div className="rounded-xl border border-sun-200 bg-sun-50 px-4 py-3 text-xs text-sun-900 space-y-2">
            {optimizationMetrics && (
              <p>
                Success rate: {optimizationMetrics.successRate}% · Posted: {optimizationMetrics.posted} · Failed: {optimizationMetrics.failed}
                {optimizationMetrics.bestHour ? ` · Best hour: ${optimizationMetrics.bestHour}` : ""}
              </p>
            )}
            {optimizationTips.length > 0 && (
              <ul className="space-y-1">
                {optimizationTips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* ── Autopilot Activity Timeline ──────────────────── */}
      <section className="card p-6">
        <h3 className="section-title mb-5">Autopilot Activity</h3>

        <ol className="relative border-l border-page-border pl-6">
          {activityLog.map((item, idx) => {
            const LogIcon = item.icon;
            return (
              <li
                key={idx}
                className={cn(
                  "relative pb-6 last:pb-0"
                )}
              >
                {/* Dot */}
                <span
                  className={cn(
                    "absolute -left-[33px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white",
                    item.dot
                  )}
                >
                  <LogIcon className="h-3 w-3 text-white" />
                </span>

                <p className="text-sm font-medium text-gray-800">
                  {item.text}
                </p>
                <p className="text-xs text-gray-400">{item.time}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Save Button ──────────────────────────────────── */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={savingSettings} className="btn-primary">
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Saved!
            </>
          ) : savingSettings ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Autopilot Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
