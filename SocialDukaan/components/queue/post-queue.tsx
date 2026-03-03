"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Instagram,
  Facebook,
  Sparkles,
  Check,
  Send,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Channel = "instagram" | "facebook";
type TaskStatus = "review" | "upcoming" | "posted" | "rejected";

interface WeeklyContentTask {
  id: string;
  channel: Channel;
  pageId: string;
  pageName: string;
  accountHandle: string;
  competitorHandle: string;
  caption: string;
  research?: {
    title?: string;
    summary?: string;
    sourceUrl?: string;
    inferredTopic?: string;
    basedOn?: string[];
  };
  scheduledAt: string;
  status: TaskStatus;
  imageUrl?: string;
  postedAt?: string;
  error?: string;
}

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4 text-channel-instagram" />,
  facebook: <Facebook className="h-4 w-4 text-channel-facebook" />,
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  review: "bg-gray-100 text-gray-700",
  upcoming: "bg-blue-100 text-blue-700",
  posted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  review: "Review",
  upcoming: "Upcoming",
  posted: "Posted",
  rejected: "Rejected",
};

const TABS: Array<{ key: "all" | TaskStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "review", label: "Review" },
  { key: "upcoming", label: "Upcoming" },
  { key: "posted", label: "Posted" },
  { key: "rejected", label: "Rejected" },
];

interface AccountsData {
  connected: boolean;
  pages: { id: string; name: string }[];
}

export default function PostQueue() {
  const [activeTab, setActiveTab] = useState<"all" | TaskStatus>("all");
  const [tasks, setTasks] = useState<WeeklyContentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [bulkBusy, setBulkBusy] = useState<"" | "approve_all" | "autopost_all" | "delete_all">("");
  const [campaignTopic, setCampaignTopic] = useState("upcoming running event in India");
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedPageId, setSelectedPageId] = useState("");

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      const data = await response.json();
      setTasks(Array.isArray(data.tasks) ? (data.tasks as WeeklyContentTask[]) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    fetch("/api/auth/accounts")
      .then((response) => response.json())
      .then((data: AccountsData) => {
        setPages(data.pages ?? []);
        if (data.pages?.[0]?.id) {
          setSelectedPageId((prev) => prev || data.pages[0].id);
        }
      })
      .catch(() => {
        setPages([]);
      });
  }, []);

  const generateWeeklyTasks = async () => {
    if (!selectedPageId) return;
    setGenerating(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          pageId: selectedPageId,
          days: 7,
          channels: ["facebook", "instagram"],
          campaignTopic: campaignTopic.trim() || undefined,
        }),
      });
      await loadTasks();
      setActiveTab("review");
    } finally {
      setGenerating(false);
    }
  };

  const approveTask = async (taskId: string) => {
    setBusyId(taskId);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", taskId }),
      });
      await loadTasks();
    } finally {
      setBusyId("");
    }
  };

  const autopostTask = async (taskId: string) => {
    setBusyId(taskId);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "autopost", taskId }),
      });
      await loadTasks();
    } finally {
      setBusyId("");
    }
  };

  const rejectTask = async (taskId: string) => {
    setBusyId(taskId);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", taskId }),
      });
      await loadTasks();
    } finally {
      setBusyId("");
    }
  };

  const deleteTask = async (taskId: string) => {
    setBusyId(taskId);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", taskId }),
      });
      await loadTasks();
    } finally {
      setBusyId("");
    }
  };

  const approveAll = async () => {
    setBulkBusy("approve_all");
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_all" }),
      });
      await loadTasks();
      setActiveTab("upcoming");
    } finally {
      setBulkBusy("");
    }
  };

  const autopostAll = async () => {
    setBulkBusy("autopost_all");
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "autopost_all" }),
      });
      await loadTasks();
      setActiveTab("posted");
    } finally {
      setBulkBusy("");
    }
  };

  const deleteAllInTab = async () => {
    const taskIds = filtered.map((task) => task.id);
    if (taskIds.length === 0) return;

    setBulkBusy("delete_all");
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_many", taskIds }),
      });
      await loadTasks();
      setActiveTab("all");
    } finally {
      setBulkBusy("");
    }
  };

  const filtered = useMemo(() => {
    if (activeTab === "all") return tasks;
    return tasks.filter((task) => task.status === activeTab);
  }, [activeTab, tasks]);

  return (
    <div className="space-y-5">
      {/* Linear-style controls */}
      <div className="card rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_auto_auto_auto]">
          <input
            value={campaignTopic}
            onChange={(e) => setCampaignTopic(e.target.value)}
            placeholder="Campaign topic (e.g. upcoming running event in India)"
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none ring-0 focus:border-gray-400"
          />
          <select
            value={selectedPageId}
            onChange={(e) => setSelectedPageId(e.target.value)}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none ring-0 focus:border-gray-400"
          >
            {pages.length === 0 && <option value="">No connected pages</option>}
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
          <button
            onClick={generateWeeklyTasks}
            disabled={generating || !selectedPageId}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Week
          </button>
          <button
            onClick={approveAll}
            disabled={bulkBusy !== ""}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            {bulkBusy === "approve_all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approve All
          </button>
          <button
            onClick={autopostAll}
            disabled={bulkBusy !== ""}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {bulkBusy === "autopost_all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Autopost All
          </button>
          <button
            onClick={deleteAllInTab}
            disabled={bulkBusy !== "" || filtered.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 disabled:opacity-50"
          >
            {bulkBusy === "delete_all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete All
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="card flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              activeTab === tab.key
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div className="space-y-2">
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
            Loading tasks…
          </div>
        )}

        {!loading && filtered.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-50">
                    {CHANNEL_ICONS[task.channel]}
                  </span>
                  <span className="text-xs font-medium text-gray-700">{task.accountHandle}</span>
                  <span className="text-xs text-gray-400">vs {task.competitorHandle}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLES[task.status])}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-800">{task.caption}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(task.scheduledAt).toLocaleString()} • {task.pageName}
                </p>
                {task.research?.title && (
                  <details className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1">
                    <summary className="cursor-pointer text-xs font-medium text-gray-700">Research source</summary>
                    <div className="mt-1 space-y-1 text-xs text-gray-600">
                      <p><span className="font-medium">Insight:</span> {task.research.title}</p>
                      {task.research.summary && <p>{task.research.summary}</p>}
                      {task.research.inferredTopic && <p><span className="font-medium">Topic:</span> {task.research.inferredTopic}</p>}
                      {task.research.sourceUrl && (
                        <a
                          href={task.research.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          View source
                        </a>
                      )}
                    </div>
                  </details>
                )}
                {task.error && <p className="mt-1 text-xs text-red-600">{task.error}</p>}
              </div>

              <div className="flex items-center gap-2">
                {task.status === "review" && (
                  <button
                    onClick={() => approveTask(task.id)}
                    disabled={busyId === task.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busyId === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Approve
                  </button>
                )}

                {(task.status === "review" || task.status === "upcoming") && (
                  <button
                    onClick={() => rejectTask(task.id)}
                    disabled={busyId === task.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    {busyId === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    Reject
                  </button>
                )}

                {(task.status === "upcoming" || task.status === "review") && (
                  <button
                    onClick={() => autopostTask(task.id)}
                    disabled={busyId === task.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {busyId === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Autopost
                  </button>
                )}

                <button
                  onClick={() => deleteTask(task.id)}
                  disabled={busyId === task.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {busyId === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No content in this tab yet.
          </div>
        )}
      </div>
    </div>
  );
}
