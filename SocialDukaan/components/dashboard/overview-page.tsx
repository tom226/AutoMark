"use client";

import {
  TrendingUp,
  Heart,
  Users,
  CalendarClock,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import EngagementChart from "@/components/charts/engagement-chart";

const stats = [
  {
    label: "Total Posts",
    value: "248",
    change: "+12%",
    icon: TrendingUp,
    accent: "bg-sun-50 text-sun-600",
  },
  {
    label: "Engagement Rate",
    value: "4.7%",
    change: "+0.3%",
    icon: Heart,
    accent: "bg-rose-50 text-rose-500",
  },
  {
    label: "Followers Gained",
    value: "+1,284",
    change: "+8.1%",
    icon: Users,
    accent: "bg-sky-50 text-sky-500",
  },
  {
    label: "Scheduled Posts",
    value: "18",
    change: "Next 7 days",
    icon: CalendarClock,
    accent: "bg-emerald-50 text-emerald-500",
  },
];

const upcomingPosts = [
  {
    title: "5 Tips to Boost Your Online Presence",
    channel: "Instagram",
    time: "Today, 3:00 PM",
    color: "bg-gradient-to-br from-pink-500 to-orange-400",
  },
  {
    title: "Behind the Scenes — Product Shoot",
    channel: "Facebook",
    time: "Tomorrow, 10:00 AM",
    color: "bg-blue-500",
  },
  {
    title: "Weekly Marketing Roundup #42",
    channel: "LinkedIn",
    time: "Mar 4, 9:00 AM",
    color: "bg-sky-700",
  },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="card flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.accent}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="mt-0.5 text-2xl font-bold text-gray-900">
                  {s.value}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3 w-3" />
                  {s.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Upcoming posts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Engagement chart — spans 2 cols */}
        <div className="lg:col-span-2">
          <EngagementChart />
        </div>

        {/* Upcoming posts */}
        <div className="card rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="section-title mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Upcoming Posts
          </h2>

          <ul className="space-y-4">
            {upcomingPosts.map((post, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50"
              >
                <span
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${post.color}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">
                    {post.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {post.time} · {post.channel}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <button className="btn-ghost mt-4 w-full rounded-xl py-2 text-center text-sm font-medium text-sun-600 transition hover:bg-sun-50">
            View full queue →
          </button>
        </div>
      </div>
    </div>
  );
}
