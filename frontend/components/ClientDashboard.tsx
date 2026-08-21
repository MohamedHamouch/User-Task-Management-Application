"use client";

import React, { useState, useEffect, useCallback } from "react";
import api, { ApiTask, getErrorMessage } from "@/lib/api";
import StatusBadge from "./StatusBadge";

export default function ClientDashboard() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const openCreateModal = () => {
    setEditingTask(null);
    setForm({ title: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (task: ApiTask) => {
    if (task.status !== "pending") {
      showFeedback("error", "Only pending tasks can be edited.");
      return;
    }
    setEditingTask(task);
    setForm({ title: task.title, description: task.description || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showFeedback("error", "Task title is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, {
          title: form.title,
          description: form.description || null,
        });
        showFeedback("success", "Task updated successfully.");
      } else {
        await api.post("/tasks", {
          title: form.title,
          description: form.description || null,
        });
        showFeedback("success", "Task request submitted successfully.");
      }
      setIsModalOpen(false);
      loadTasks();
    } catch (err: unknown) {
      showFeedback("error", getErrorMessage(err, "Failed to save task."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Client Portal & Tasks
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Create new task requests and track progress with assigned workers
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          + Request New Task
        </button>
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
            My Submitted Tasks ({tasks.length})
          </h2>
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
            Note: Tasks can only be edited while in pending status
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-600 dark:text-zinc-400">
            Loading your tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              No tasks yet
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Click &quot;Request New Task&quot; above to submit your first task request.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Assigned Worker</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 max-w-md">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                      {task.worker ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {task.worker.name}
                        </div>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600 italic">
                          Awaiting Worker Assignment
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {task.status === "pending" ? (
                        <button
                          onClick={() => openEditModal(task)}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-600 italic" title="Cannot edit active or completed tasks">
                          Locked ({task.status.replace("_", " ")})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-lg">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
              {editingTask ? "Edit Pending Task" : "New Task Request"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Website Redesign Brief"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Description / Requirements
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide detailed context or scope for the worker..."
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : editingTask ? "Save Changes" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
