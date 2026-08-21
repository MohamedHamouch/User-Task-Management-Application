"use client";

import React, { useState, useEffect, useCallback } from "react";
import api, { ApiTask, getErrorMessage } from "@/lib/api";
import StatusBadge from "./StatusBadge";

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: res } = await api.get<{ tasks: ApiTask[] }>("/tasks");
      setTasks(res.tasks);
    } catch (err) {
      showFeedback("error", getErrorMessage(err, "Failed to load tasks"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      showFeedback("success", `Task status updated to ${newStatus.replace("_", " ")}.`);
      loadTasks();
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status: newStatus as "pending" | "in_progress" | "completed" } : null));
      }
    } catch (err: unknown) {
      showFeedback("error", getErrorMessage(err, "Failed to update task status."));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Worker Dashboard
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            View assigned task specifications and transition workflow status
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Tasks Assigned to You ({tasks.length})
          </h2>
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
            Click any task to inspect details or update its progress
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-600 dark:text-zinc-400">
            Loading assigned tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              No tasks currently assigned
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              You will see tasks listed here once an administrator assigns them to you.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Update Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                      #{task.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-sm mt-0.5">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                      {task.client?.name || `Client #${task.client_id}`}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        disabled={updatingTaskId === task.id}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 text-zinc-900 dark:text-white focus:outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-lg space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  Task #{selectedTask.id}
                </span>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                  {selectedTask.title}
                </h2>
              </div>
              <StatusBadge status={selectedTask.status} />
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Client:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedTask.client?.name} ({selectedTask.client?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Created on:</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {new Date(selectedTask.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Full Description / Requirements
              </h3>
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap min-h-[80px]">
                {selectedTask.description || "No description provided by the client."}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Status:</span>
                <select
                  disabled={updatingTaskId === selectedTask.id}
                  value={selectedTask.status}
                  onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                  className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md px-2.5 py-1 text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
