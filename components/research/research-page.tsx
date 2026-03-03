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
  warning?: string;
  error?: string;
}

interface PreferenceResponse {
  platforms: string[];
  categories: string[];
  categoryWeights: Record<string, number>;
  customHashtags: string[];
  updatedAt: string;
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

  const loadSnapshot = async () => {
    setLoading(true);
    setError("");
    setWarning("");
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

    try {
      const response = await fetch("/api/research", { method: "POST" });
      const data = (await response.json()) as ResearchResponse;

      if (!response.ok || data.error) {
        setError(data.error || "Failed to refresh research.");
        return;
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setTrending(Array.isArray(data.trendingHashtags) ? data.trendingHashtags : []);
      setUpdatedAt(data.updatedAt || "");
      if (data.warning) setWarning(data.warning);
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Hashtag Research Inputs</h4>
        <p className="mb-3 text-xs text-gray-500">Choose platforms and categories for trend research, and add your own hashtags.</p>

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Research Database</h3>
            <p className="text-sm text-gray-500">
              Wrapper-fetched competitor content and trending hashtags are stored and used for generation.
            </p>
          </div>
          <button
            onClick={refreshResearch}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh Research
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" /> Stored items: {items.length}</span>
          <span className="inline-flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> Trending tags: {trending.length}</span>
          <span>Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "Never"}</span>
        </div>
        {warning && <p className="mt-2 text-xs text-amber-600">{warning}</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
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
