"use client";

import { Bell, Search, ChevronDown, Sun } from "lucide-react";
import { useState } from "react";

interface TopNavProps {
  title?: string;
}

export default function TopNav({ title = "Dashboard" }: TopNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        {searchOpen ? (
          <input
            autoFocus
            onBlur={() => setSearchOpen(false)}
            placeholder="Search..."
            className="input h-9 w-56 text-sm"
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sun-500" />
        </button>

        {/* Profile */}
        <button className="ml-2 flex items-center gap-2 rounded-xl border border-gray-100 py-1.5 pl-1.5 pr-3 transition hover:bg-gray-50">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sun-100 text-xs font-bold text-sun-700">
            A
          </div>
          <span className="text-sm font-medium text-gray-700">Arpit</span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
