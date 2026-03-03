"use client";

import { useEffect, useState } from "react";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Plus,
  Trash2,
  Zap,
  TrendingUp,
  Hash,
  Clock,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/cn";
import type { Competitor, Channel } from "@/lib/types";

type VerificationStatus = "unchecked" | "checking" | "verified" | "not_found" | "unknown";

type CompetitorRow = Competitor & {
  isSeed?: boolean;
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
  checkedAt?: string;
};

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

/* ── sparkline data (random-ish weekly activity) ──────────── */

const spark = (base: number) =>
  Array.from({ length: 12 }, (_, i) => ({
    w: i,
    v: base + Math.round(Math.sin(i * 0.9) * 3 + Math.random() * 2),
  }));

/* ── component ────────────────────────────────────────────── */

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [newChannel, setNewChannel] = useState<Channel>("instagram");
  const [newHandle, setNewHandle] = useState("");

  const loadCompetitors = async () => {
    try {
      const response = await fetch("/api/competitors", { cache: "no-store" });
      const data = await response.json();
      setCompetitors(Array.isArray(data.competitors) ? (data.competitors as CompetitorRow[]) : []);
    } catch {
      setCompetitors([]);
    }
  };

  useEffect(() => {
    loadCompetitors();
  }, []);

  const verifyCompetitor = async (id: string) => {
    const target = competitors.find((item) => item.id === id);
    if (!target) return;

    setCompetitors((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, verificationStatus: "checking", verificationMessage: "Checking…" } : item
      )
    );

    try {
      const response = await fetch("/api/competitors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitorId: target.id,
          handle: target.handle,
          channel: target.channel,
        }),
      });
      const data = await response.json();

      const status =
        data.status === "verified" || data.status === "not_found" || data.status === "unknown"
          ? (data.status as VerificationStatus)
          : "unknown";

      setCompetitors((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                verificationStatus: status,
                verificationMessage: data.message ?? "Verification completed.",
                checkedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch {
      setCompetitors((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                verificationStatus: "unknown",
                verificationMessage: "Verification failed due to network or platform restriction.",
                checkedAt: new Date().toISOString(),
              }
            : item
        )
      );
    }
  };

  const addCompetitor = () => {
    const handle = newHandle.trim();
    if (!handle) return;
    void (async () => {
      await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          channel: newChannel,
        }),
      });
      setNewHandle("");
      await loadCompetitors();
    })();
  };

  const removeCompetitor = (id: string) => {
    void (async () => {
      await fetch(`/api/competitors?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadCompetitors();
    })();
  };

  const avgPosts =
    competitors.length > 0
      ? (
          competitors.reduce((s, c) => s + c.postsPerWeek, 0) /
          competitors.length
        ).toFixed(1)
      : "0";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ── Add Competitor ───────────────────────────────── */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Add Competitor</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Channel select */}
          <div className="flex-shrink-0">
            <label className="label">Channel</label>
            <select
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value as Channel)}
              className="input w-full sm:w-40"
            >
              {(Object.keys(channelMeta) as Channel[]).map((ch) => (
                <option key={ch} value={ch}>
                  {channelMeta[ch].label}
                </option>
              ))}
            </select>
          </div>

          {/* Handle input */}
          <div className="flex-1">
            <label className="label">Handle</label>
            <input
              type="text"
              placeholder="@competitor"
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
              className="input"
            />
          </div>

          {/* Track button */}
          <button
            onClick={addCompetitor}
            disabled={!newHandle.trim()}
            className="btn-primary whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Track
          </button>
        </div>
      </div>

      {/* ── Competitor List ──────────────────────────────── */}
      <div className="space-y-4">
        {competitors.map((comp) => {
          const meta = channelMeta[comp.channel];
          const Icon = meta.icon;
          const data = spark(comp.postsPerWeek);

          return (
            <div key={comp.id} className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: icon + handle */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      meta.bg
                    )}
                  >
                    <Icon className={cn("h-5 w-5", meta.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {comp.handle}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-400">{meta.label}</span>
                      {comp.isSeed ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Seed Data
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          User Added
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <TrendingUp className="h-3.5 w-3.5 text-sun-500" />
                    <span>
                      <strong>{comp.postsPerWeek}</strong> posts/wk
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Zap className="h-3.5 w-3.5 text-sun-500" />
                    <span>
                      <strong>{comp.avgEngagement}%</strong> eng.
                    </span>
                  </div>

                  {/* Sparkline */}
                  <div className="h-[30px] w-20">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={30}>
                      <LineChart data={data}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Hashtags + remove */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {comp.topHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="badge bg-sun-50 text-sun-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => verifyCompetitor(comp.id)}
                    disabled={comp.verificationStatus === "checking"}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                    title="Verify account"
                  >
                    {comp.verificationStatus === "checking" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : comp.verificationStatus === "verified" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : comp.verificationStatus === "not_found" ? (
                      <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {comp.verificationStatus === "checking"
                      ? "Checking"
                      : comp.verificationStatus === "verified"
                        ? "Verified"
                        : comp.verificationStatus === "not_found"
                          ? "Not Found"
                          : comp.verificationStatus === "unknown"
                            ? "Unknown"
                            : "Verify"}
                  </button>
                  <button
                    onClick={() => removeCompetitor(comp.id)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {comp.verificationMessage && (
                <p className="mt-3 text-xs text-gray-500">{comp.verificationMessage}</p>
              )}
            </div>
          );
        })}

        {competitors.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">
            No competitors tracked yet. Add one above to get started.
          </p>
        )}
      </div>

      {/* ── Insights Summary ─────────────────────────────── */}
      {competitors.length > 0 && (
        <div className="card space-y-4 p-6">
          <h3 className="section-title flex items-center gap-2">
            <Hash className="h-5 w-5 text-sun-500" />
            Competitor Insights
          </h3>

          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-sun-500" />
              Your competitors post an average of{" "}
              <strong className="text-gray-900">{avgPosts}</strong>{" "}
              times&nbsp;per&nbsp;week.
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-sun-500" />
              Peak posting times:{" "}
              <strong className="text-gray-900">10 AM, 2 PM, 6 PM</strong>
            </li>
            <li className="flex items-start gap-2">
              <Hash className="mt-0.5 h-4 w-4 flex-shrink-0 text-sun-500" />
              Most used hashtags:{" "}
              <span className="font-medium text-gray-900">
                #marketing, #growth, #socialmedia
              </span>
            </li>
          </ul>

          <div className="rounded-xl bg-sun-50 px-4 py-3 text-sm text-sun-800">
            <Zap className="mr-1.5 inline h-4 w-4 text-sun-500" />
            <strong>Suggestion:</strong> Enable{" "}
            <a
              href="/dashboard/autopilot"
              className="font-semibold underline decoration-sun-300 underline-offset-2 hover:text-sun-900"
            >
              Autopilot
            </a>{" "}
            to automatically match their posting frequency.
          </div>
        </div>
      )}
    </div>
  );
}
