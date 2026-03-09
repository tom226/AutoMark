"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  PenSquare,
  CalendarDays,
  ListOrdered,
  BarChart3,
  Settings,
  Zap,
  Target,
  Bot,
  LinkIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/dashboard",           label: "Overview",     Icon: LayoutDashboard },
  { href: "/dashboard/compose",   label: "Compose",      Icon: PenSquare },
  { href: "/dashboard/calendar",  label: "Calendar",     Icon: CalendarDays },
  { href: "/dashboard/queue",     label: "Queue",        Icon: ListOrdered },
  { href: "/dashboard/competitors", label: "Competitors", Icon: Target },
  { href: "/dashboard/research", label: "Research", Icon: Search },
  { href: "/dashboard/autopilot", label: "Autopilot",    Icon: Bot },
  { href: "/dashboard/analytics", label: "Analytics",    Icon: BarChart3 },
  { href: "/dashboard/onboarding", label: "Connect",     Icon: LinkIcon },
  { href: "/dashboard/settings",  label: "Settings",     Icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/accounts?provider=all", { method: "DELETE" });
    } finally {
      router.push("/dashboard/onboarding");
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-gray-100 bg-white transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sun-500 shadow-md">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-extrabold tracking-tight text-gray-900">
            Social<span className="text-sun-500">Dukaan</span>
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 overflow-y-auto py-4 px-2">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-sun-50 text-sun-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition",
                  active ? "text-sun-600" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pb-2">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Logout"
          className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            "text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-400 group-hover:text-red-600" />
          {!collapsed && (loggingOut ? "Logging out..." : "Logout")}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="m-2 flex items-center justify-center rounded-xl border border-gray-100 py-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
