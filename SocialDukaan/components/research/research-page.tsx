"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Hash, Database, Globe } from "lucide-react";

interface ResearchItem {
  id: string;
  competitorHandle: string;
  channel: "instagram" | "facebook" | "linkedin" | "twitter";
  sourceUrl: string;
  title: string;
  snippet: string;
  hashtags: string[];
  fetchedAt: string;
}

interface TrendingHashtag {
  tag: string;
  count: number;
  sources: string[];
}

interface ResearchResponse {
  items: ResearchItem[];
  trendingHashtags: TrendingHashtag[];
  updatedAt: string;
  fetchedCount?: number;
  statusMessage?: string;
  diagnostics?: ResearchDiagnostics;
  nextStep?: string;
  warning?: string;
  error?: string;
}

interface ResearchDiagnostics {
  attemptedSources: number;
  acceptedSources: number;
  rejectedSources: number;
  rejectionReasons: Record<string, number>;
}

interface PreferenceResponse {
  platforms: string[];
  categories: string[];
  categoryWeights: Record<string, number>;
  customHashtags: string[];
  updatedAt: string;
}

interface ResearchPreset {
  id: "local-business" | "creator" | "events";
  label: string;
  description: string;
  platforms: string[];
  categories: string[];
  categoryWeights: Record<string, number>;
  customHashtags: string[];
}

interface AutomationTaskSummary {
  id: string;
  channel: "instagram" | "facebook";
  scheduledAt: string;
  caption: string;
}

interface AutomationDraft {
  task: AutomationTaskSummary;
  hashtags: string[];
  pillar: string;
  reason: string;
}

interface AutomationResponse {
  status?: string;
  generated?: number;
  queueSaved?: number;
  bestPracticesApplied?: string[];
  drafts?: AutomationDraft[];
  message?: string;
  error?: string;
}

const PLATFORM_OPTIONS = [
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
  "tiktok",
  "youtube",
];

const CATEGORY_OPTIONS = [
  "sports",
  "movies",
  "gaming",
  "business",
  "marketing",
  "technology",
  "fashion",
  "health",
  "travel",
  "food",
  "education",
];

const REJECTION_LABEL_MAP: Record<string, string> = {
  timeout_or_network: "Network timeout or temporary fetch issue",
  http_not_ok: "Source page was unavailable",
  content_too_short: "Not enough useful content",
  login_wall_or_blocked: "Login wall or restricted page",
  low_relevance: "Content not relevant to your selected topic",
};

const RESEARCH_PRESETS: ResearchPreset[] = [
  {
    id: "local-business",
    label: "Local Business",
    description: "Best for shops, salons, clinics, cafes, and service businesses.",
    platforms: ["instagram", "facebook", "linkedin"],
    categories: ["business", "marketing", "travel"],
    categoryWeights: {
      business: 5,
      marketing: 4,
      travel: 2,
    },
    customHashtags: ["#smallbusiness", "#localbusiness", "#shoplocal"],
  },
  {
    id: "creator",
    label: "Creator",
    description: "Best for personal brands, educators, and content creators.",
    platforms: ["instagram", "tiktok", "youtube", "twitter"],
    categories: ["marketing", "technology", "education"],
    categoryWeights: {
      marketing: 4,
      technology: 3,
      education: 5,
    },
    customHashtags: ["#contentcreator", "#personalbrand", "#creatorlife"],
  },
  {
    id: "events",
    label: "Events",
    description: "Best for marathons, workshops, communities, and event pages.",
    platforms: ["instagram", "facebook", "linkedin"],
    categories: ["sports", "business", "travel"],
    categoryWeights: {
      sports: 5,
      business: 3,
      travel: 3,
    },
    customHashtags: ["#events", "#community", "#registernow"],
  },
];

export default function ResearchPage() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [trending, setTrending] = useState<TrendingHashtag[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "facebook"]);
  const [categories, setCategories] = useState<string[]>(["marketing", "business"]);
  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({ marketing: 3, business: 3 });
  const [customHashtags, setCustomHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState<ResearchDiagnostics | null>(null);
  const [activePreset, setActivePreset] = useState<ResearchPreset["id"] | null>(null);
  const [automationLoading, setAutomationLoading] = useState(false);
  const [automationError, setAutomationError] = useState("");
  const [automationMessage, setAutomationMessage] = useState("");
  const [automationGoal, setAutomationGoal] = useState<"engagement" | "awareness" | "leads" | "sales">("engagement");
  const [automationPostsPerWeek, setAutomationPostsPerWeek] = useState(6);
  const [automationWeeks, setAutomationWeeks] = useState(1);
  const [automationTopic, setAutomationTopic] = useState("");
  const [automationTone, setAutomationTone] = useState("professional");
  const [automationSaveToQueue, setAutomationSaveToQueue] = useState(true);
  const [automationDrafts, setAutomationDrafts] = useState<AutomationDraft[]>([]);

  const loadSnapshot = async () => {
    setLoading(true);
    setError("");
    setWarning("");
    setStatusMessage("");
    setDiagnostics(null);
    try {
      const response = await fetch("/api/research", { cache: "no-store" });
      const data = (await response.json()) as ResearchResponse;
      setItems(Array.isArray(data.items) ? data.items : []);
      setTrending(Array.isArray(data.trendingHashtags) ? data.trendingHashtags : []);
      setUpdatedAt(data.updatedAt || "");
      if (data.warning) setWarning(data.warning);
    } catch {
      setError("Failed to load stored research.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, []);

  useEffect(() => {
    fetch("/api/research/preferences", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: PreferenceResponse) => {
        setPlatforms(Array.isArray(data.platforms) ? data.platforms : ["instagram", "facebook"]);
        setCategories(Array.isArray(data.categories) ? data.categories : ["marketing", "business"]);
        setCategoryWeights(data.categoryWeights && typeof data.categoryWeights === "object" ? data.categoryWeights : { marketing: 3, business: 3 });
        setCustomHashtags(Array.isArray(data.customHashtags) ? data.customHashtags : []);
      })
      .catch(() => {
        // keep defaults
      });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshResearch();
    }, 60 * 60 * 1000);

    return () => window.clearInterval(id);
  }, []);

  const refreshResearch = async () => {
    setRefreshing(true);
    setError("");
    setWarning("");
    setStatusMessage("");
    setDiagnostics(null);

    try {
      const response = await fetch("/api/research", { method: "POST" });
      const data = (await response.json()) as ResearchResponse;

      if (!response.ok || data.error) {
        setError(data.error || "Failed to refresh research.");
        if (data.nextStep) setWarning(data.nextStep);
        return;
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setTrending(Array.isArray(data.trendingHashtags) ? data.trendingHashtags : []);
      setUpdatedAt(data.updatedAt || "");
      if (data.warning) setWarning(data.warning);
      if (data.statusMessage) setStatusMessage(data.statusMessage);
      if (data.diagnostics) setDiagnostics(data.diagnostics);
    } catch {
      setError("Failed to refresh research.");
    } finally {
      setRefreshing(false);
    }
  };

  const groupedByCompetitor = useMemo(() => {
    const map = new Map<string, ResearchItem[]>();
    for (const item of items) {
      const key = item.competitorHandle || "@unknown";
      const group = map.get(key) ?? [];
      group.push(item);
      map.set(key, group);
    }
    return [...map.entries()];
  }, [items]);

  const friendlyDiagnostics = useMemo(() => {
    if (!diagnostics) return [] as Array<{ label: string; count: number }>;
    return Object.entries(diagnostics.rejectionReasons)
      .map(([key, count]) => ({ label: REJECTION_LABEL_MAP[key] ?? key, count }))
      .sort((a, b) => b.count - a.count);
  }, [diagnostics]);

  const recommendedPreset = useMemo(() => {
    let best: { preset: ResearchPreset; score: number } | null = null;

    for (const preset of RESEARCH_PRESETS) {
      const platformScore = preset.platforms.filter((item) => platforms.includes(item)).length;
      const categoryScore = preset.categories.filter((item) => categories.includes(item)).length;
      const hashtagScore = preset.customHashtags.filter((item) => customHashtags.includes(item)).length;
      const totalScore = platformScore * 2 + categoryScore * 2 + hashtagScore;

      if (!best || totalScore > best.score) {
        best = { preset, score: totalScore };
      }
    }

    return best?.preset ?? null;
  }, [platforms, categories, customHashtags]);

  const toggleSelection = (
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
      if (setter === setCategories) {
        setCategoryWeights((prev) => {
          const next = { ...prev };
          delete next[value];
          return next;
        });
      }
    } else {
      setter([...current, value]);
      if (setter === setCategories) {
        setCategoryWeights((prev) => ({ ...prev, [value]: prev[value] ?? 3 }));
      }
    }
  };

  const setCategoryWeight = (category: string, weight: number) => {
    setCategoryWeights((prev) => ({ ...prev, [category]: Math.max(1, Math.min(5, weight)) }));
  };

  const addCustomHashtag = () => {
    const clean = hashtagInput.trim().toLowerCase().replace(/\s+/g, "");
    if (!clean) return;
    const normalized = clean.startsWith("#") ? clean : `#${clean}`;
    setCustomHashtags((prev) => (prev.includes(normalized) ? prev : [...prev, normalized].slice(0, 30)));
    setHashtagInput("");
  };

  const applyPreset = (preset: ResearchPreset) => {
    setPlatforms(preset.platforms);
    setCategories(preset.categories);
    setCategoryWeights(preset.categoryWeights);
    setCustomHashtags(preset.customHashtags);
    setActivePreset(preset.id);
    setError("");
    setWarning("");
    setStatusMessage(`Preset applied: ${preset.label}. Click \"Save Inputs\" to continue.`);
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    setError("");

    try {
      const response = await fetch("/api/research/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms, categories, categoryWeights, customHashtags }),
      });

      const data = (await response.json()) as PreferenceResponse & { error?: string };
      if (!response.ok || data.error) {
        setError(data.error || "Failed to save hashtag preferences.");
        return;
      }

      setPlatforms(data.platforms ?? platforms);
      setCategories(data.categories ?? categories);
      setCategoryWeights(data.categoryWeights ?? categoryWeights);
      setCustomHashtags(data.customHashtags ?? customHashtags);
      await refreshResearch();
    } catch {
      setError("Failed to save hashtag preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const runPostAutomation = async () => {
    setAutomationLoading(true);
    setAutomationError("");
    setAutomationMessage("");

    try {
      const response = await fetch("/api/tools/post-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: automationGoal,
          postsPerWeek: Math.max(2, Math.min(28, automationPostsPerWeek)),
          weeks: Math.max(1, Math.min(4, automationWeeks)),
          campaignTopic: automationTopic.trim() || undefined,
          tone: automationTone.trim() || undefined,
          channels: ["instagram", "facebook"],
          saveToQueue: automationSaveToQueue,
        }),
      });

      const data = (await response.json()) as AutomationResponse;
      if (!response.ok || data.error) {
        setAutomationError(data.error || "Failed to generate automated posts.");
        setAutomationDrafts([]);
        return;
      }

      setAutomationDrafts(Array.isArray(data.drafts) ? data.drafts : []);
      setAutomationMessage(
        data.message ||
          `Generated ${data.generated ?? 0} drafts${(data.queueSaved ?? 0) > 0 ? ` and saved ${data.queueSaved} to queue` : ""}.`
      );

      if (automationSaveToQueue && (data.queueSaved ?? 0) > 0) {
        await refreshResearch();
      }
    } catch {
      setAutomationError("Failed to generate automated posts.");
      setAutomationDrafts([]);
    } finally {
      setAutomationLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-base font-semibold text-blue-900">How To Use Research (3 Easy Steps)</h3>
        <ol className="mt-2 space-y-1 text-sm text-blue-900">
          <li>1. Select your platforms, categories, and optional custom hashtags below.</li>
          <li>2. Click <span className="font-medium">Save Inputs</span> to store your choices.</li>
          <li>3. Click <span className="font-medium">Refresh Research Now</span> and review results + diagnostics.</li>
        </ol>
        <p className="mt-2 text-xs text-blue-700">
          Tip: If many sources are skipped, adjust your categories/hashtags to be more specific and refresh again.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Hashtag Research Inputs</h4>
        <p className="mb-3 text-xs text-gray-500">Choose where to research, what topics matter, and optional hashtags you care about.</p>

        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-800">Quick Presets (One-Click Setup)</p>

          {recommendedPreset ? (
            <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-xs font-medium text-blue-900">
                Recommended for you: <span className="font-semibold">{recommendedPreset.label}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-blue-700">{recommendedPreset.description}</p>
              <button
                onClick={() => applyPreset(recommendedPreset)}
                className="mt-2 rounded-md border border-blue-700 bg-blue-700 px-2.5 py-1 text-[11px] font-medium text-white"
              >
                Use Recommended Preset
              </button>
            </div>
          ) : null}

          <div className="grid gap-2 md:grid-cols-3">
            {RESEARCH_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className={`rounded-md border p-2 text-left ${
                  activePreset === preset.id
                    ? "border-gray-900 bg-white"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className="text-xs font-semibold text-gray-900">{preset.label}</p>
                <p className="mt-1 text-[11px] text-gray-600">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-medium text-gray-700">Platforms</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleSelection(option, platforms, setPlatforms)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${platforms.includes(option) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-700">Categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleSelection(option, categories, setCategories)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${categories.includes(option) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700"}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {categories.map((category) => (
                <div key={`weight-${category}`} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5">
                  <span className="text-xs text-gray-700">{category}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={categoryWeights[category] ?? 3}
                      onChange={(e) => setCategoryWeight(category, Number(e.target.value))}
                    />
                    <span className="w-5 text-right text-xs font-medium text-gray-700">{categoryWeights[category] ?? 3}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-700">Custom Hashtags</p>
            <div className="flex gap-2">
              <input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomHashtag();
                  }
                }}
                placeholder="#yourhashtag"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              />
              <button onClick={addCustomHashtag} className="rounded-md border border-gray-300 px-3 py-2 text-sm">Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {customHashtags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setCustomHashtags((prev) => prev.filter((item) => item !== tag))}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={savePreferences}
              disabled={savingPrefs}
              className="inline-flex items-center gap-2 rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Inputs
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">One-Click Post Automation</h4>
            <p className="mt-1 text-xs text-gray-500">
              Generate a full weekly posting batch from your research inputs. Keep drafts in review mode so you can approve before publishing.
            </p>
          </div>
          <button
            onClick={runPostAutomation}
            disabled={automationLoading}
            className="inline-flex items-center gap-2 rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {automationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Generate Weekly Drafts
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-700">Goal</span>
            <select
              value={automationGoal}
              onChange={(e) => setAutomationGoal(e.target.value as "engagement" | "awareness" | "leads" | "sales")}
              className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm"
            >
              <option value="engagement">Engagement</option>
              <option value="awareness">Awareness</option>
              <option value="leads">Leads</option>
              <option value="sales">Sales</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-700">Tone</span>
            <input
              value={automationTone}
              onChange={(e) => setAutomationTone(e.target.value)}
              placeholder="professional"
              className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-700">Posts Per Week</span>
            <input
              type="number"
              min={2}
              max={28}
              value={automationPostsPerWeek}
              onChange={(e) => setAutomationPostsPerWeek(Number(e.target.value))}
              className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-700">Weeks</span>
            <input
              type="number"
              min={1}
              max={4}
              value={automationWeeks}
              onChange={(e) => setAutomationWeeks(Number(e.target.value))}
              className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm"
            />
          </label>
        </div>

        <label className="mt-3 block space-y-1">
          <span className="text-xs font-medium text-gray-700">Campaign Topic (optional)</span>
          <input
            value={automationTopic}
            onChange={(e) => setAutomationTopic(e.target.value)}
            placeholder="e.g. summer menu launch"
            className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm"
          />
        </label>

        <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={automationSaveToQueue}
            onChange={(e) => setAutomationSaveToQueue(e.target.checked)}
          />
          Save generated drafts to review queue
        </label>

        {automationError ? <p className="mt-2 text-xs text-red-600">{automationError}</p> : null}
        {automationMessage ? <p className="mt-2 text-xs text-green-700">{automationMessage}</p> : null}

        {automationDrafts.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-gray-700">Generated Draft Preview</p>
            {automationDrafts.slice(0, 5).map((draft) => (
              <div key={draft.task.id} className="rounded-md border border-gray-100 bg-gray-50 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                  <span className="font-medium text-gray-800">{draft.task.channel.toUpperCase()}</span>
                  <span>{new Date(draft.task.scheduledAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-gray-700">{draft.reason}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">{draft.task.caption}</p>
              </div>
            ))}
            {automationDrafts.length > 5 ? (
              <p className="text-[11px] text-gray-500">Showing first 5 drafts. Total generated: {automationDrafts.length}.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Research Database</h3>
            <p className="text-sm text-gray-500">
              We collect useful competitor + trend content and store it for caption generation.
            </p>
          </div>
          <button
            onClick={refreshResearch}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Research Now
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" /> Stored items: {items.length}</span>
          <span className="inline-flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> Trending tags: {trending.length}</span>
          <span>Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "Never"}</span>
        </div>
        {warning && <p className="mt-2 text-xs text-amber-600">{warning}</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {statusMessage && <p className="mt-2 text-xs text-green-700">{statusMessage}</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Refresh Diagnostics</h4>
        {!diagnostics ? (
          <p className="text-sm text-gray-500">Run “Refresh Research Now” to see what was accepted and what was skipped.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <p className="text-gray-500">Sources Checked</p>
                <p className="text-base font-semibold text-gray-900">{diagnostics.attemptedSources}</p>
              </div>
              <div className="rounded-md border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-800">
                <p className="text-green-700">Accepted</p>
                <p className="text-base font-semibold">{diagnostics.acceptedSources}</p>
              </div>
              <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="text-amber-700">Skipped</p>
                <p className="text-base font-semibold">{diagnostics.rejectedSources}</p>
              </div>
            </div>

            {friendlyDiagnostics.length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-medium text-gray-700">Why Some Sources Were Skipped</p>
                <div className="space-y-1">
                  {friendlyDiagnostics.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5 text-xs text-gray-700">
                      <span>{item.label}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Trending Hashtags</h4>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : trending.length === 0 ? (
            <p className="text-sm text-gray-500">No trend data yet. Click Refresh Research.</p>
          ) : (
            <div className="space-y-2">
              {trending.map((tag) => (
                <div key={tag.tag} className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{tag.tag}</span>
                    <span className="text-xs text-gray-500">{tag.count} hits</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{tag.sources.join(" • ")}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Competitor Research</h4>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : groupedByCompetitor.length === 0 ? (
            <p className="text-sm text-gray-500">No competitor research in database yet.</p>
          ) : (
            <div className="space-y-4">
              {groupedByCompetitor.map(([handle, group]) => (
                <div key={handle} className="rounded-lg border border-gray-100 p-3">
                  <p className="text-sm font-semibold text-gray-900">{handle}</p>
                  <div className="mt-2 space-y-2">
                    {group.slice(0, 3).map((item) => (
                      <div key={item.id} className="rounded-md border border-gray-100 bg-gray-50 p-2">
                        <p className="text-xs font-medium text-gray-800">{item.title}</p>
                        <p className="mt-1 text-xs text-gray-600">{item.snippet}</p>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 underline"
                        >
                          <Globe className="h-3 w-3" />
                          Source
                        </a>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.hashtags.slice(0, 8).map((tag) => (
                            <span key={`${item.id}-${tag}`} className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
