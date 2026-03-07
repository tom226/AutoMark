"use client";

import { useEffect, useState } from "react";

import {
  Eye,
  TrendingUp,
  Clock,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { cn } from "@/lib/cn";

/* ── Metric cards data ────────────────────────────────────── */

const METRICS = [
  {
    label: "Total Reach",
    value: "125K",
    icon: Eye,
    accent: "bg-sun-50 text-sun-600",
  },
  {
    label: "Engagement Rate",
    value: "4.7%",
    icon: TrendingUp,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Best Posting Time",
    value: "10:00 AM",
    icon: Clock,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    label: "Top Channel",
    value: "Instagram",
    icon: Instagram,
    accent: "bg-pink-50 text-channel-instagram",
  },
];

/* ── Weekly reach chart data ──────────────────────────────── */

const WEEKLY_REACH = [
  { week: "W1", reach: 14200 },
  { week: "W2", reach: 16800 },
  { week: "W3", reach: 15500 },
  { week: "W4", reach: 19300 },
  { week: "W5", reach: 21700 },
  { week: "W6", reach: 20100 },
  { week: "W7", reach: 24500 },
  { week: "W8", reach: 27300 },
];

/* ── Top performing posts ─────────────────────────────────── */

const TOP_POSTS = [
  {
    id: "tp1",
    channel: "instagram" as const,
    caption: "Product launch teaser — 5 reasons you'll love it 🚀",
    likes: 1420,
    comments: 218,
    reach: 32400,
  },
  {
    id: "tp2",
    channel: "facebook" as const,
    caption: "Community milestone: 50K members strong ❤️",
    likes: 870,
    comments: 132,
    reach: 21000,
  },
  {
    id: "tp3",
    channel: "linkedin" as const,
    caption: "How we scaled our content pipeline — a case study",
    likes: 640,
    comments: 97,
    reach: 18500,
  },
];

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4 text-channel-instagram" />,
  facebook: <Facebook className="h-4 w-4 text-channel-facebook" />,
  linkedin: <Linkedin className="h-4 w-4 text-channel-linkedin" />,
};

/* ── Competitor comparison data ────────────────────────────── */

const COMPETITOR_DATA = [
  { name: "Mon", you: 4, competitor: 2 },
  { name: "Tue", you: 3, competitor: 3 },
  { name: "Wed", you: 5, competitor: 2 },
  { name: "Thu", you: 2, competitor: 4 },
  { name: "Fri", you: 6, competitor: 3 },
  { name: "Sat", you: 3, competitor: 1 },
  { name: "Sun", you: 1, competitor: 2 },
];

/* ── Helpers ──────────────────────────────────────────────── */

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

/* ── Component ────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    setChartsReady(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => (
          <div key={m.label} className="card flex items-center gap-4 p-5">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                m.accent
              )}
            >
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {m.label}
              </p>
              <p className="text-xl font-bold text-gray-900">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly reach line chart */}
      <div className="card p-6">
        <h3 className="section-title mb-4">Weekly Reach</h3>
        <div className="h-72">
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
              <LineChart data={WEEKLY_REACH}>
                <CartesianGrid stroke="#f0f0ec" strokeDasharray="4 4" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid #f0f0ec",
                    fontSize: 13,
                  }}
                  formatter={(value: number | undefined) =>
                    value != null ? [formatNumber(value), "Reach"] : ["—", "Reach"]
                  }
                />
                <Line
                  type="monotone"
                  dataKey="reach"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-xl bg-gray-50" />
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top performing posts */}
        <div className="card p-6">
          <h3 className="section-title mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {TOP_POSTS.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 rounded-xl border border-gray-100 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                  {CHANNEL_ICONS[post.channel]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {post.caption}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span>❤️ {formatNumber(post.likes)}</span>
                    <span>💬 {formatNumber(post.comments)}</span>
                    <span>👁 {formatNumber(post.reach)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitor comparison */}
        <div className="card p-6">
          <h3 className="section-title mb-4">Competitor Comparison</h3>
          <p className="mb-4 text-xs text-gray-400">
            Posts per day — You vs. Competitor
          </p>
          <div className="h-56">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <BarChart data={COMPETITOR_DATA} barGap={4}>
                  <CartesianGrid
                    stroke="#f0f0ec"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "1px solid #f0f0ec",
                      fontSize: 13,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="you"
                    name="You"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    dataKey="competitor"
                    name="Competitor"
                    fill="#d1d5db"
                    radius={[6, 6, 0, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-xl bg-gray-50" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
