"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleBadgeColors: Record<string, string> = {
    admin: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
    client: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    worker: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-bold text-sm tracking-wide">
            TM
          </div>
          <div>
            <span className="font-semibold text-zinc-900 dark:text-white tracking-tight text-base">
              TaskFlow
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-zinc-600 dark:text-zinc-400">
              Management App
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 text-right">
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user.name}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {user.email}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border uppercase tracking-wider ${
                roleBadgeColors[user.role] || "bg-zinc-100 text-zinc-800 border-zinc-200"
              }`}
            >
              {user.role}
            </span>
          </div>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

          <button
            onClick={() => logout()}
            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
