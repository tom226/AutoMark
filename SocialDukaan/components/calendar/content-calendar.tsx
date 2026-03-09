"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Channel = "instagram" | "facebook";
type TaskStatus = "review" | "upcoming" | "posted";

interface WeeklyContentTask {
  id: string;
  channel: Channel;
  pageName: string;
  accountHandle: string;
  competitorHandle: string;
  caption: string;
  scheduledAt: string;
  status: TaskStatus;
}

interface FestivalEvent {
  id: string;
  name: string;
  date: string;
  templateCaption: string;
  tags: string[];
}

const CHANNEL_COLORS: Record<Channel, string> = {
  instagram: "bg-pink-500",
  facebook: "bg-blue-500",
};

const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4 text-channel-instagram" />,
  facebook: <Facebook className="h-4 w-4 text-channel-facebook" />,
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  review: "bg-gray-100 text-gray-700",
  upcoming: "bg-blue-100 text-blue-700",
  posted: "bg-emerald-100 text-emerald-700",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ContentCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [tasks, setTasks] = useState<WeeklyContentTask[]>([]);
  const [events, setEvents] = useState<FestivalEvent[]>([]);

  useEffect(() => {
    fetch("/api/tasks", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setTasks(Array.isArray(data.tasks) ? (data.tasks as WeeklyContentTask[]) : []);
      })
      .catch(() => {
        setTasks([]);
      });
  }, []);

  useEffect(() => {
    fetch("/api/festivals?mode=upcoming&days=120", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setEvents(Array.isArray(data.events) ? (data.events as FestivalEvent[]) : []);
      })
      .catch(() => setEvents([]));
  }, []);

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();

  // getDay() returns 0=Sun, we want 0=Mon
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const getTasksForDay = (day: number) => {
    return tasks.filter((task) => {
      const scheduled = new Date(task.scheduledAt);
      return (
        scheduled.getFullYear() === currentYear &&
        scheduled.getMonth() === currentMonth &&
        scheduled.getDate() === day
      );
    });
  };

  const getDotsForDay = (day: number) => {
    const dayTasks = getTasksForDay(day);
    const channels = [...new Set(dayTasks.map((task) => task.channel))];
    return channels.slice(0, 3);
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const d = new Date(event.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day;
    });
  };

  const selectedPosts = useMemo(() => {
    if (!selectedDay) return [];
    return tasks.filter((task) => {
      const scheduled = new Date(task.scheduledAt);
      return (
        scheduled.getFullYear() === currentYear &&
        scheduled.getMonth() === currentMonth &&
        scheduled.getDate() === selectedDay
      );
    });
  }, [selectedDay, tasks, currentMonth, currentYear]);

  function goPrev() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function goNext() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "default",
    { month: "long" }
  );

  // Build grid cells
  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ day: prevMonthLastDay - startDow + 1 + i, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, inMonth: false });
    }
  }

  return (
    <div className="space-y-5">
      {/* Calendar Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        {/* Month header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goPrev}
            className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">
            {monthName} {currentYear}
          </h2>
          <button
            onClick={goNext}
            className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day labels */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            const dots = cell.inMonth ? getDotsForDay(cell.day) : [];
            const dayEvents = cell.inMonth ? getEventsForDay(cell.day) : [];
            const selected = cell.inMonth && cell.day === selectedDay;
            const todayCell = cell.inMonth && isToday(cell.day);

            return (
              <button
                key={idx}
                onClick={() => cell.inMonth && setSelectedDay(cell.day)}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center rounded-lg border text-sm transition",
                  cell.inMonth
                    ? "cursor-pointer border-gray-100 hover:bg-gray-50"
                    : "cursor-default border-transparent text-gray-300",
                  selected && "border-gray-900 bg-gray-900 font-semibold text-white",
                  todayCell &&
                    !selected &&
                    "border-gray-400"
                )}
              >
                <span className={cn(todayCell && !selected && "font-semibold text-gray-900")}>
                  {cell.day}
                </span>
                {dots.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dots.map((ch) => (
                      <span
                        key={ch}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          CHANNEL_COLORS[ch]
                        )}
                      />
                    ))}
                  </div>
                )}
                {dayEvents.length > 0 && (
                  <span className="mt-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                    Festive
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-amber-900">Upcoming India Festivals & Events</h3>
        {events.length === 0 ? (
          <p className="text-sm text-amber-700">No upcoming events available right now.</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 6).map((event) => (
              <div key={event.id} className="rounded-lg border border-amber-100 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{event.name}</p>
                  <span className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">{event.templateCaption}</p>
                <a
                  href={`/dashboard/compose?eventId=${encodeURIComponent(event.id)}`}
                  className="mt-2 inline-flex rounded-md bg-sun-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sun-600"
                >
                  Use in Compose
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected day posts */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          {selectedDay
            ? `Tasks for ${monthName} ${selectedDay}`
            : "Select a day to view tasks"}
        </h3>

        {selectedPosts.length === 0 && selectedDay && (
          <p className="text-sm text-gray-500">
            No tasks scheduled for this day.
          </p>
        )}

        <div className="space-y-3">
          {selectedPosts.map((post) => (
            <div
              key={post.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              {/* Channel icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-50">
                {CHANNEL_ICONS[post.channel]}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-800">
                  {post.caption}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>•</span>
                  <span>{post.accountHandle}</span>
                </div>
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  "badge shrink-0 capitalize",
                  STATUS_STYLES[post.status]
                )}
              >
                {post.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
