import React from "react";

interface StatusBadgeProps {
  status: "pending" | "in_progress" | "completed" | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          In Progress
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Completed
        </span>
      );
    case "pending":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
  }
}
