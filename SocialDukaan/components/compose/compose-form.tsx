"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Sparkles,
  Upload,
  CalendarClock,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
  LinkIcon,
  ChevronDown,
  Newspaper,
  PlusCircle,
  FlaskConical,
  Trophy,
  Gauge,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { CompetitorFeedItem, Experiment } from "@/lib/types";
import { useSearchParams } from "next/navigation";

interface AccountsData {
  connected: boolean;
  connectedAt?: string;
  pages: { id: string; name: string }[];
  instagramAccounts: { igId: string; pageId: string; pageName: string }[];
  linkedin?: {
    connected: boolean;
    profile?: { id?: string; name?: string; email?: string; picture?: string };
  };
  twitter?: {
    connected: boolean;
    profile?: { id?: string; username?: string; name?: string };
  };
}

interface ContentScoreReason {
  key: string;
  label: string;
  status: "good" | "warn" | "bad";
  score: number;
  tip: string;
}

interface ContentScoreResponse {
  status?: string;
  score?: number;
  grade?: "A" | "B" | "C";
  predictedBand?: "high" | "medium" | "low";
  reasons?: ContentScoreReason[];
  improveActions?: string[];
  message?: string;
  error?: string;
}

interface ContentFixResponse {
  status?: string;
  improvedCaption?: string;
  appliedFixes?: string[];
  beforeScore?: number;
  afterScore?: number;
  message?: string;
  error?: string;
}

interface OnboardingData {
  profile?: {
    niche?: string;
    primaryObjective?: string;
    businessType?: string;
    preferredLanguage?: string;
  };
}

interface FestivalEvent {
  id: string;
  name: string;
  date: string;
}

const channels = [
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-br from-pink-500 to-orange-400 text-white",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    color: "bg-blue-600 text-white",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "bg-sky-700 text-white",
  },
  {
    key: "twitter",
    label: "Twitter",
    icon: Twitter,
    color: "bg-gray-900 text-white",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    color: "bg-emerald-600 text-white",
  },
] as const;

type ChannelKey = (typeof channels)[number]["key"];

const MAX_CHARS = 2200;

export default function ComposeForm() {
  const [selected, setSelected] = useState<ChannelKey[]>(["instagram"]);
  const [activeChannel, setActiveChannel] = useState<ChannelKey>("instagram");
  const [accounts, setAccounts] = useState<AccountsData | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedInstagramPageId, setSelectedInstagramPageId] = useState("");
  const [selectedFacebookPageId, setSelectedFacebookPageId] = useState("");
  const [selectedTwitterAccount, setSelectedTwitterAccount] = useState("primary");
  const [selectedLinkedinAccount, setSelectedLinkedinAccount] = useState("primary");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResults, setPostResults] = useState<Record<string, { success: boolean; id?: string; error?: string }> | null>(null);
  const [feedItems, setFeedItems] = useState<CompetitorFeedItem[]>([]);
  const [feedCursor, setFeedCursor] = useState(0);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [selectedInspirationIds, setSelectedInspirationIds] = useState<string[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [experimentsLoading, setExperimentsLoading] = useState(false);
  const [experimentBusy, setExperimentBusy] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [scoreData, setScoreData] = useState<ContentScoreResponse | null>(null);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixError, setFixError] = useState("");
  const [fixData, setFixData] = useState<ContentFixResponse | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [language, setLanguage] = useState("hinglish");
  const [festivalEvents, setFestivalEvents] = useState<FestivalEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const searchParams = useSearchParams();

  const toggle = (key: ChannelKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        const next = prev.filter((k) => k !== key);
        if (activeChannel === key) {
          setActiveChannel(next[0] ?? "instagram");
        }
        return next;
      }

      setActiveChannel(key);
      return [...prev, key];
    });
  };

  useEffect(() => {
    fetch("/api/auth/accounts")
      .then((response) => response.json())
      .then((data: AccountsData) => {
        setAccounts(data);
        if (data.pages?.[0]?.id) setSelectedFacebookPageId((prev) => prev || data.pages[0].id);
      })
      .finally(() => setAccountsLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/festivals?mode=upcoming&days=120", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setFestivalEvents(Array.isArray(data.events) ? (data.events as FestivalEvent[]) : []);
      })
      .catch(() => setFestivalEvents([]));
  }, []);

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    if (eventId) setSelectedEventId(eventId);
  }, [searchParams]);

  const loadFeed = async (reset = false) => {
    if (feedLoading) return;
    setFeedLoading(true);
    try {
      const cursor = reset ? 0 : feedCursor;
      const response = await fetch(`/api/competitors/feed?cursor=${cursor}&limit=10`);
      const data = await response.json();

      const nextItems = Array.isArray(data.items) ? (data.items as CompetitorFeedItem[]) : [];

      setFeedItems((prev) => (reset ? nextItems : [...prev, ...nextItems]));
      setFeedCursor(data.cursor ?? cursor + nextItems.length);
      setFeedHasMore(Boolean(data.hasMore));
    } catch {
      // keep silent, compose should still work
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadExperiments = async () => {
    setExperimentsLoading(true);
    try {
      const response = await fetch("/api/experiments?status=running");
      const data = await response.json();
      setExperiments(Array.isArray(data.experiments) ? (data.experiments as Experiment[]) : []);
    } catch {
      setExperiments([]);
    } finally {
      setExperimentsLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const instagramForSelectedPage = useMemo(
    () => accounts?.instagramAccounts.find((item) => item.pageId === selectedInstagramPageId),
    [accounts, selectedInstagramPageId]
  );

  const firstInstagramLinkedPageId = useMemo(() => {
    if (!accounts) return "";
    const igPageIds = new Set(accounts.instagramAccounts.map((item) => item.pageId));
    return accounts.pages.find((page) => igPageIds.has(page.id))?.id ?? "";
  }, [accounts]);

  useEffect(() => {
    if (!selected.includes("instagram")) return;
    if (instagramForSelectedPage) return;
    if (!firstInstagramLinkedPageId) return;
    setSelectedInstagramPageId(firstInstagramLinkedPageId);
  }, [selected, instagramForSelectedPage, firstInstagramLinkedPageId]);

  const activeChannelOptions = useMemo(() => {
    if (!accounts) return [] as { value: string; label: string }[];

    if (activeChannel === "instagram") {
      return accounts.instagramAccounts.map((item) => ({ value: item.pageId, label: `${item.pageName} (IG linked)` }));
    }

    if (activeChannel === "facebook") {
      return accounts.pages.map((page) => ({ value: page.id, label: page.name }));
    }

    if (activeChannel === "twitter") {
      if (!accounts.twitter?.connected) return [];
      const handle = accounts.twitter.profile?.username ? `@${accounts.twitter.profile.username}` : "Connected account";
      return [{ value: "primary", label: handle }];
    }

    if (activeChannel === "linkedin") {
      if (!accounts.linkedin?.connected) return [];
      const name = accounts.linkedin.profile?.name || "LinkedIn profile";
      return [{ value: "primary", label: name }];
    }

    if (activeChannel === "whatsapp") {
      return [{ value: "business", label: "WhatsApp Business" }];
    }

    return [];
  }, [accounts, activeChannel]);

  const activeChannelAccountValue =
    activeChannel === "instagram"
      ? selectedInstagramPageId
      : activeChannel === "facebook"
        ? selectedFacebookPageId
        : activeChannel === "twitter"
          ? selectedTwitterAccount
          : selectedLinkedinAccount;

  const setActiveChannelAccountValue = (value: string) => {
    if (activeChannel === "instagram") {
      setSelectedInstagramPageId(value);
      return;
    }
    if (activeChannel === "facebook") {
      setSelectedFacebookPageId(value);
      return;
    }
    if (activeChannel === "twitter") {
      setSelectedTwitterAccount(value);
      return;
    }
    setSelectedLinkedinAccount(value);
  };

  const handleGenerate = async () => {
    if (selected.length === 0) return;
    setGenerating(true);
    setGenerateError("");
    try {
      const onboardingRes = await fetch("/api/onboarding", { cache: "no-store" });
      const onboardingData = (await onboardingRes.json()) as OnboardingData;
      const niche = onboardingData.profile?.niche?.trim();
      const objective = onboardingData.profile?.primaryObjective?.trim();
      const businessType = onboardingData.profile?.businessType?.trim();
      const preferredLanguage = onboardingData.profile?.preferredLanguage?.trim().toLowerCase();
      if (preferredLanguage) setLanguage(preferredLanguage);

      if (!niche) {
        setGenerateError("Please set your niche in onboarding so AI can generate relevant content.");
        return;
      }

      const inspirations = feedItems
        .filter((item) => selectedInspirationIds.includes(item.id))
        .map((item) => `${item.handle}: ${item.caption}`);

      const objectiveText = objective ? ` with focus on ${objective}` : "";
      const businessTypeText = businessType ? ` for a ${businessType}` : "";
      const topic = `${niche}${businessTypeText}${objectiveText}`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          channel: selected[0],
          language,
          eventId: selectedEventId || undefined,
          niche,
          inspirations,
        }),
      });
      const data = await res.json();
      if (data.caption) {
        setCaption(data.caption);
      } else {
        setGenerateError("Could not generate content. Please try again.");
      }
    } catch {
      setGenerateError("Could not generate content. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!caption.trim() || selected.length === 0) return;
    setPosting(true);
    setPostResults(null);
    try {
      const supportedChannels = selected.filter(
        (c) => c === "instagram" || c === "facebook" || c === "twitter" || c === "whatsapp"
      );
      if (supportedChannels.length === 0) {
        setPostResults({
          info: {
            success: false,
            error: "Only Instagram, Facebook, and Twitter/X are supported right now.",
          },
        });
        return;
      }

      const socialChannels = supportedChannels.filter((c) => c !== "whatsapp");
      const needsMetaPage = socialChannels.some((c) => c === "instagram" || c === "facebook");
      const effectiveMetaPageId = supportedChannels.includes("instagram")
        ? selectedInstagramPageId
        : selectedFacebookPageId;

      if (
        supportedChannels.includes("instagram") &&
        supportedChannels.includes("facebook") &&
        selectedInstagramPageId &&
        selectedFacebookPageId &&
        selectedInstagramPageId !== selectedFacebookPageId
      ) {
        setPostResults({
          auth: {
            success: false,
            error: "For combined Instagram + Facebook posting, choose the same page account in both tabs.",
          },
        });
        return;
      }

      if (needsMetaPage && !effectiveMetaPageId) {
        setPostResults({ auth: { success: false, error: "Please select a Facebook Page to publish from." } });
        return;
      }

      if (supportedChannels.includes("instagram") && !instagramForSelectedPage) {
        if (firstInstagramLinkedPageId) {
          setSelectedInstagramPageId(firstInstagramLinkedPageId);
          setPostResults({
            auth: {
              success: false,
              error: "Instagram posting requires an IG-linked page. I switched to an eligible page — click Post Now again.",
            },
          });
        } else {
          setPostResults({
            auth: {
              success: false,
              error:
                "No Instagram Business Account is linked to any connected page. Link Instagram to your Facebook Page in Meta Business settings, then reconnect.",
            },
          });
        }
        return;
      }

      const results: Record<string, { success: boolean; id?: string; error?: string }> = {};

      if (socialChannels.length > 0) {
        const res = await fetch("/api/social/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channels: socialChannels,
            caption,
            imageUrl: imageUrl.trim() || undefined,
            pageId: needsMetaPage ? effectiveMetaPageId : undefined,
          }),
        });
        const data = await res.json();
        if (data.error) {
          results.auth = { success: false, error: data.error };
        } else {
          Object.assign(results, data.results);
        }
      }

      if (supportedChannels.includes("whatsapp")) {
        const scheduledAt = date && time ? new Date(`${date}T${time}`).toISOString() : new Date().toISOString();
        const waRes = await fetch("/api/whatsapp/broadcasts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "schedule",
            title: "Compose Broadcast",
            message: caption,
            mediaUrl: imageUrl.trim() || undefined,
            scheduledAt,
            audience: ["all_customers"],
          }),
        });
        const waData = await waRes.json();
        results.whatsapp = waRes.ok
          ? { success: true, id: waData.broadcast?.id }
          : { success: false, error: waData.error || "WhatsApp scheduling failed" };
      }

      setPostResults(results);
    } catch {
      setPostResults({ network: { success: false, error: "Network error. Check your connection." } });
    } finally {
      setPosting(false);
    }
  };

  const charPercent = Math.min((caption.length / MAX_CHARS) * 100, 100);
  const charColor =
    caption.length > MAX_CHARS
      ? "text-red-500"
      : caption.length > MAX_CHARS * 0.9
        ? "text-amber-500"
        : "text-gray-400";

  const toggleInspiration = (id: string) => {
    setSelectedInspirationIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const createExperimentFromCaption = async () => {
    if (!caption.trim() || selected.length === 0) return;

    setExperimentBusy(true);
    try {
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          channel: selected[0],
          pageId:
            selected[0] === "instagram"
              ? selectedInstagramPageId || undefined
              : selected[0] === "facebook"
                ? selectedFacebookPageId || undefined
                : undefined,
          baseCaption: caption,
          topic: "compose-ab-test",
        }),
      });
      const data = await response.json();
      if (data.experiment) {
        await loadExperiments();
      }
    } catch {
      // keep compose flow unblocked
    } finally {
      setExperimentBusy(false);
    }
  };

  const updateMetric = async (
    experimentId: string,
    variant: "A" | "B",
    impressions: number,
    engagements: number
  ) => {
    setExperimentBusy(true);
    try {
      await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "track",
          experimentId,
          variant,
          impressions,
          engagements,
        }),
      });
      await loadExperiments();
    } finally {
      setExperimentBusy(false);
    }
  };

  const evaluateExperimentWinner = async (experimentId: string) => {
    setExperimentBusy(true);
    try {
      await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          experimentId,
        }),
      });
      await loadExperiments();
    } finally {
      setExperimentBusy(false);
    }
  };

  const calcRate = (impressions: number, engagements: number) => {
    if (impressions <= 0) return "0.0";
    return ((engagements / impressions) * 100).toFixed(1);
  };

  const checkPostScore = async () => {
    if (!caption.trim() || selected.length === 0) return;

    setScoreLoading(true);
    setScoreError("");

    const selectedDateTime =
      date && time ? new Date(`${date}T${time}`).toISOString() : undefined;

    try {
      const response = await fetch("/api/content/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          channel: selected[0],
          imageUrl: imageUrl.trim() || undefined,
          scheduledAt: selectedDateTime,
        }),
      });

      const data = (await response.json()) as ContentScoreResponse;
      if (!response.ok || data.error) {
        setScoreError(data.error || "Failed to score this post.");
        setScoreData(null);
        return;
      }

      setScoreData(data);
    } catch {
      setScoreError("Failed to score this post.");
      setScoreData(null);
    } finally {
      setScoreLoading(false);
    }
  };

  const fixWithAi = async () => {
    if (!caption.trim() || selected.length === 0) return;

    setFixLoading(true);
    setFixError("");

    const selectedDateTime =
      date && time ? new Date(`${date}T${time}`).toISOString() : undefined;

    try {
      const response = await fetch("/api/content/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption,
          channel: selected[0],
          imageUrl: imageUrl.trim() || undefined,
          scheduledAt: selectedDateTime,
        }),
      });

      const data = (await response.json()) as ContentFixResponse;
      if (!response.ok || data.error) {
        setFixError(data.error || "Failed to improve caption.");
        setFixData(null);
        return;
      }

      if (data.improvedCaption) {
        setCaption(data.improvedCaption);
      }
      setFixData(data);
      await checkPostScore();
    } catch {
      setFixError("Failed to improve caption.");
      setFixData(null);
    } finally {
      setFixLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <div className="space-y-6">
      {/* Channel selector */}
      <div className="card rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="section-title mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Publish to
        </h2>
        <div className="flex flex-wrap gap-3">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const active = selected.includes(ch.key);
            return (
              <button
                key={ch.key}
                onClick={() => toggle(ch.key)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                  active
                    ? ch.color
                    : "border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {ch.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {selected.map((channelKey) => {
              const channelLabel = channels.find((item) => item.key === channelKey)?.label ?? channelKey;
              const isActive = activeChannel === channelKey;
              return (
                <button
                  key={`account-tab-${channelKey}`}
                  onClick={() => setActiveChannel(channelKey)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                    isActive
                      ? "border-sun-300 bg-sun-50 text-sun-700"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {channelLabel}
                </button>
              );
            })}
          </div>

          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Account for {channels.find((item) => item.key === activeChannel)?.label}
          </label>
          <div className="relative">
            <select
              value={activeChannelAccountValue}
              onChange={(e) => setActiveChannelAccountValue(e.target.value)}
              disabled={accountsLoading || activeChannelOptions.length === 0}
              className="input w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-700 focus:border-sun-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sun-100 disabled:opacity-50"
            >
              {accountsLoading && <option value="">Loading accounts…</option>}
              {!accountsLoading && activeChannelOptions.length === 0 && (
                <option value="">No connected account</option>
              )}
              {activeChannelOptions.map((option) => (
                <option key={`${activeChannel}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          {selected.includes("instagram") && selectedInstagramPageId && !instagramForSelectedPage && (
            <p className="text-xs text-amber-600">
              Selected Instagram account is not linked correctly. Choose an IG-linked account before posting.
            </p>
          )}
          {selected.includes("instagram") && !firstInstagramLinkedPageId && (
            <p className="text-xs text-red-600">
              No IG-linked page found in this workspace. Connect your Instagram Business account to a Facebook Page and reconnect in onboarding.
            </p>
          )}
          {!accountsLoading && !accounts?.connected && (
            <p className="text-xs text-red-600">
              No connected account found. Connect your account from onboarding before posting.
            </p>
          )}
          {activeChannel === "twitter" && !accounts?.twitter?.connected && (
            <p className="text-xs text-amber-600">
              Twitter/X is selected but not connected yet. Connect it from onboarding to publish.
            </p>
          )}
          {activeChannel === "linkedin" && !accounts?.linkedin?.connected && (
            <p className="text-xs text-amber-600">
              LinkedIn is selected but not connected yet. Connect it from onboarding to publish.
            </p>
          )}
          {activeChannel === "whatsapp" && (
            <p className="text-xs text-emerald-700">
              WhatsApp Business broadcasts will be scheduled from this composer.
            </p>
          )}
        </div>
      </div>

      {/* Caption */}
      <div className="card rounded-2xl border border-gray-100 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title text-sm font-semibold uppercase tracking-wide text-gray-500">
            Caption
          </h2>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-secondary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-sun-600 transition hover:bg-sun-50 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            AI Generate
          </button>
        </div>

        {generateError ? <p className="mb-2 text-xs text-amber-700">{generateError}</p> : null}

        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="hinglish">Hinglish</option>
            <option value="marathi">Marathi</option>
            <option value="tamil">Tamil</option>
            <option value="bengali">Bengali</option>
            <option value="gujarati">Gujarati</option>
          </select>

          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="input rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          >
            <option value="">No festival context</option>
            {festivalEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({new Date(event.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={6}
          placeholder="Write your caption…"
          className="input w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-sun-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sun-100"
        />

        {/* Character counter */}
        <div className="mt-2 flex items-center justify-between">
          <div className="h-1 w-40 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-sun-400 transition-all"
              style={{ width: `${charPercent}%` }}
            />
          </div>
          <span className={cn("text-xs font-medium", charColor)}>
            {caption.length} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {/* Image upload area */}
      <div className="card rounded-2xl border border-gray-100 bg-white p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="section-title flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Gauge className="h-4 w-4" />
            Post Intelligence Score
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fixWithAi}
              disabled={!caption.trim() || selected.length === 0 || fixLoading}
              className="btn-outline rounded-lg border border-sun-300 px-3 py-1.5 text-xs font-semibold text-sun-700 transition hover:bg-sun-50 disabled:opacity-50"
            >
              {fixLoading ? "Fixing..." : "Fix with AI"}
            </button>
            <button
              onClick={checkPostScore}
              disabled={!caption.trim() || selected.length === 0 || scoreLoading}
              className="btn-outline rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {scoreLoading ? "Checking..." : "Check Post Score"}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Simple quality check before posting. Optimized for India audience behavior and easy-to-follow actions.
        </p>

        {scoreError ? <p className="mt-2 text-xs text-red-600">{scoreError}</p> : null}
        {fixError ? <p className="mt-2 text-xs text-red-600">{fixError}</p> : null}

        {fixData?.improvedCaption ? (
          <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <p className="font-semibold">AI Fix Applied</p>
            <p className="mt-1">
              Score improved: {fixData.beforeScore ?? "-"} → {fixData.afterScore ?? "-"}
            </p>
            {Array.isArray(fixData.appliedFixes) && fixData.appliedFixes.length > 0 ? (
              <ul className="mt-1 space-y-0.5">
                {fixData.appliedFixes.slice(0, 3).map((item, idx) => (
                  <li key={`${idx}-${item}`}>{idx + 1}. {item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {scoreData?.score != null ? (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] text-gray-500">Overall Score</p>
                <p className="text-xl font-bold text-gray-900">{scoreData.score}/100</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] text-gray-500">Grade</p>
                <p className="text-xl font-bold text-gray-900">{scoreData.grade}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-[11px] text-gray-500">Expected Reach Band</p>
                <p className="text-xl font-bold capitalize text-gray-900">{scoreData.predictedBand}</p>
              </div>
            </div>

            {scoreData.message ? <p className="text-xs text-gray-600">{scoreData.message}</p> : null}

            {Array.isArray(scoreData.improveActions) && scoreData.improveActions.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-700">Top 3 Fixes (Do This First)</p>
                <ul className="space-y-1">
                  {scoreData.improveActions.slice(0, 3).map((item, idx) => (
                    <li key={`${idx}-${item}`} className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 text-xs text-gray-700">
                      {idx + 1}. {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {Array.isArray(scoreData.reasons) && scoreData.reasons.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-semibold text-gray-700">Detailed Breakdown</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {scoreData.reasons.map((reason) => (
                    <div key={reason.key} className="rounded-lg border border-gray-100 px-2.5 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-800">{reason.label}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            reason.status === "good"
                              ? "bg-emerald-100 text-emerald-700"
                              : reason.status === "warn"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          )}
                        >
                          {reason.status}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-600">Score: {reason.score}/100</p>
                      <p className="mt-1 text-gray-500">{reason.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="card rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="section-title mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Media
        </h2>
        {/* Public image URL (required for Instagram) */}
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <LinkIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Public image URL (required for Instagram, optional for Facebook)"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <p className="mb-3 text-xs text-gray-400">
          Instagram requires a publicly hosted image URL (e.g. from Imgur, Cloudinary, your CDN).
        </p>
        <div className="flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-sun-300 hover:bg-sun-50/40">
          <Upload className="h-5 w-5 text-gray-300" />
          <p className="text-xs text-gray-400">Local file upload coming soon</p>
        </div>
      </div>

      {/* Schedule */}
      <div className="card rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="section-title mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <CalendarClock className="h-4 w-4" />
          Schedule (optional)
        </h2>
        <div className="flex flex-wrap gap-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:border-sun-400 focus:outline-none focus:ring-2 focus:ring-sun-100"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:border-sun-400 focus:outline-none focus:ring-2 focus:ring-sun-100"
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">Leave blank to post immediately when you click &quot;Post Now&quot;.</p>
      </div>

      {/* Experimentation engine */}
      <div className="card rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <FlaskConical className="h-4 w-4" />
            A/B Experiment Engine
          </h2>
          <button
            onClick={createExperimentFromCaption}
            disabled={!caption.trim() || selected.length === 0 || experimentBusy}
            className="btn-outline rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Create from Caption
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Create two caption variants, track real metrics, and auto-pick winner by engagement rate.
        </p>

        {experimentsLoading ? (
          <div className="text-xs text-gray-400">Loading experiments…</div>
        ) : experiments.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-500">
            No running experiments yet.
          </div>
        ) : (
          <div className="space-y-3">
            {experiments.slice(0, 3).map((experiment) => {
              const variantA = experiment.variants.find((item) => item.key === "A")!;
              const variantB = experiment.variants.find((item) => item.key === "B")!;

              return (
                <div key={experiment.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">
                      {experiment.channel.toUpperCase()} · {experiment.id}
                    </p>
                    <button
                      onClick={() => evaluateExperimentWinner(experiment.id)}
                      disabled={experimentBusy}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sun-700 disabled:opacity-50"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      Pick Winner
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {[variantA, variantB].map((variant) => (
                      <div key={variant.key} className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 space-y-2">
                        <p className="text-[11px] font-semibold text-gray-600">Variant {variant.key}</p>
                        <p className="line-clamp-3 text-[11px] text-gray-600">{variant.caption}</p>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min={0}
                            defaultValue={variant.impressions}
                            onBlur={(e) =>
                              updateMetric(
                                experiment.id,
                                variant.key,
                                Number(e.currentTarget.value || 0),
                                variant.engagements
                              )
                            }
                            className="input rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px]"
                            placeholder="Impr"
                          />
                          <input
                            type="number"
                            min={0}
                            defaultValue={variant.engagements}
                            onBlur={(e) =>
                              updateMetric(
                                experiment.id,
                                variant.key,
                                variant.impressions,
                                Number(e.currentTarget.value || 0)
                              )
                            }
                            className="input rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px]"
                            placeholder="Eng"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500">
                          ER: {calcRate(variant.impressions, variant.engagements)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post results */}
      {postResults && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Post Results</p>
          {Object.entries(postResults).map(([channel, result]) => (
            <div key={channel} className={cn(
              "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm",
              result.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
            )}>
              {result.success
                ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />}
              <div>
                <span className="font-semibold capitalize">{channel}: </span>
                {result.success
                  ? <>Posted successfully! Post ID: <code className="text-xs">{result.id}</code></>
                  : result.error}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <a href="/dashboard/onboarding" className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-700">
          Manage connected accounts
        </a>
        <div className="flex items-center gap-3">
          <button className="btn-outline rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">
            Save as Draft
          </button>
          <button
            onClick={handlePost}
            disabled={
              posting ||
              !caption.trim() ||
              selected.length === 0 ||
              (selected.includes("instagram") && !selectedInstagramPageId) ||
              (selected.includes("facebook") && !selectedFacebookPageId)
            }
            className="btn-primary flex items-center gap-2 rounded-xl bg-sun-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sun-600 disabled:opacity-50"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {posting ? "Posting…" : "Post Now"}
          </button>
        </div>
      </div>
      </div>

      {/* Competitor inspiration feed */}
      <aside className="card h-fit rounded-2xl border border-gray-100 bg-white p-5 lg:sticky lg:top-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Newspaper className="h-4 w-4" />
            Similar Account Posts
          </h3>
          <button
            onClick={() => loadFeed(true)}
            className="text-xs font-medium text-sun-600 hover:text-sun-700"
          >
            Refresh
          </button>
        </div>

        <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
          {feedItems.map((item) => {
            const active = selectedInspirationIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border px-3 py-3 text-xs transition",
                  active ? "border-sun-300 bg-sun-50" : "border-gray-200 bg-white"
                )}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-700">{item.handle}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase text-gray-500">
                    {item.channel}
                  </span>
                </div>
                <p className="line-clamp-4 text-gray-600">{item.caption}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.hashtags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-sun-100 px-2 py-0.5 text-[10px] text-sun-700">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => toggleInspiration(item.id)}
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 text-[11px] font-medium",
                    active ? "text-sun-700" : "text-gray-500 hover:text-sun-700"
                  )}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {active ? "Added for AI" : "Use for AI"}
                </button>
              </div>
            );
          })}

          {feedItems.length === 0 && !feedLoading && (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
              No competitor posts available yet.
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            Selected for AI: {selectedInspirationIds.length}
          </p>
          <button
            onClick={() => loadFeed(false)}
            disabled={!feedHasMore || feedLoading}
            className="text-xs font-medium text-sun-600 disabled:opacity-40"
          >
            {feedLoading ? "Loading…" : feedHasMore ? "Load more" : "No more"}
          </button>
        </div>
      </aside>
    </div>
  );
}
