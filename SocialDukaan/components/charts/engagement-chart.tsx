"use client";

import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { day: "Mon", Likes: 320, Comments: 80 },
  { day: "Tue", Likes: 450, Comments: 120 },
  { day: "Wed", Likes: 380, Comments: 95 },
  { day: "Thu", Likes: 520, Comments: 150 },
  { day: "Fri", Likes: 610, Comments: 180 },
  { day: "Sat", Likes: 480, Comments: 130 },
  { day: "Sun", Likes: 540, Comments: 160 },
];

interface PayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-gray-500">{label}</p>
      {payload.map((entry: PayloadItem) => (
        <p
          key={entry.name}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: entry.color }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function EngagementChart() {
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(true);
  }, []);

  return (
    <div className="card rounded-2xl border border-gray-100 bg-white p-5">
      <h2 className="section-title mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Engagement — Last 7 Days
      </h2>
      <p className="mb-5 text-2xl font-bold text-gray-900">3,300 interactions</p>

      <div className="h-64 w-full">
        {chartReady ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="likeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ec" vertical={false} />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#9ca3af" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#9ca3af" }}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="Likes"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#likeFill)"
              />
              <Area
                type="monotone"
                dataKey="Comments"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#commentFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full rounded-xl bg-gray-50" />
        )}
      </div>
    </div>
  );
}
