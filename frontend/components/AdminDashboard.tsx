"use client";

import React, { useState, useEffect, useCallback } from "react";
import api, { ApiTask, ApiUser, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import StatusBadge from "./StatusBadge";

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"tasks" | "users">("tasks");

  // Tasks state
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Users state
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Selectable clients & workers for dropdowns
  const [clients, setClients] = useState<ApiUser[]>([]);
  const [workers, setWorkers] = useState<ApiUser[]>([]);

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    client_id: "",
    worker_id: "",
    status: "pending" as "pending" | "in_progress" | "completed",
  });

  // User Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "client" as "admin" | "client" | "worker",
  });

  // Feedback messages
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch tasks
  const loadTasks = useCallback(async () => {
    setIsLoadingTasks(true);
    try {
      const endpoint = taskStatusFilter === "all" ? "/tasks" : `/tasks?status=${taskStatusFilter}`;
      const { data: res } = await api.get<{ tasks: ApiTask[] }>(endpoint);
      setTasks(res.tasks);
    } catch (err) {
      showFeedback("error", getErrorMessage(err, "Failed to load tasks"));
    } finally {
      setIsLoadingTasks(false);
    }
  }, [taskStatusFilter]);

  // Fetch users
  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const endpoint = userRoleFilter === "all" ? "/users" : `/users?role=${userRoleFilter}`;
      const { data: res } = await api.get<{ users: ApiUser[] }>(endpoint);
      setUsers(res.users);
    } catch (err) {
      showFeedback("error", getErrorMessage(err, "Failed to load users"));
    } finally {
      setIsLoadingUsers(false);
    }
  }, [userRoleFilter]);

  // Fetch clients & workers for dropdowns
  const loadDropdownOptions = async () => {
    try {
      const [clientRes, workerRes] = await Promise.all([
        api.get<{ users: ApiUser[] }>("/users?role=client"),
        api.get<{ users: ApiUser[] }>("/users?role=worker"),
      ]);
      const clientData = clientRes.data;
      const workerData = workerRes.data;
      setClients(clientData.users);
      setWorkers(workerData.users);
    } catch {
      // Ignored if non-critical
    }
  };

  useEffect(() => {
    loadTasks();
    loadUsers();
    loadDropdownOptions();
  }, [loadTasks, loadUsers]);

  // Open Task Modal
  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      client_id: clients[0]?.id.toString() || "",
      worker_id: "",
      status: "pending",
    });
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: ApiTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      client_id: task.client_id.toString(),
      worker_id: task.worker_id ? task.worker_id.toString() : "",
      status: task.status,
    });
    setIsTaskModalOpen(true);
  };

  // Submit Task Form
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.client_id) {
      showFeedback("error", "Title and Client are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description || null,
        client_id: parseInt(taskForm.client_id, 10),
        worker_id: taskForm.worker_id ? parseInt(taskForm.worker_id, 10) : null,
        status: taskForm.status,
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, payload);
        showFeedback("success", "Task updated successfully.");
      } else {
        await api.post("/tasks", payload);
        showFeedback("success", "Task created successfully.");
      }

      setIsTaskModalOpen(false);
      loadTasks();
    } catch (err: unknown) {
      showFeedback("error", getErrorMessage(err, "An error occurred saving the task."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      showFeedback("success", "Task deleted successfully.");
      loadTasks();
    } catch (err) {
      showFeedback("error", getErrorMessage(err, "Failed to delete task"));
    }
  };

  // Open User Modal
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "client",
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: ApiUser) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsUserModalOpen(true);
  };

  // Submit User Form
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || (!editingUser && !userForm.password)) {
      showFeedback("error", "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
      };
      if (userForm.password) {
        payload.password = userForm.password;
      }

      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        showFeedback("success", "User updated successfully.");
      } else {
        await api.post("/users", payload);
        showFeedback("success", "User created successfully.");
      }

      setIsUserModalOpen(false);
      loadUsers();
      loadDropdownOptions();
    } catch (err: unknown) {
      showFeedback("error", getErrorMessage(err, "An error occurred saving the user."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser?.id) {
      showFeedback("error", "You cannot delete your own account.");
      return;
    }

    if (!confirm("Are you sure you want to delete this user? All associated client tasks will also be removed.")) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      showFeedback("success", "User deleted successfully.");
      loadUsers();
      loadDropdownOptions();
      loadTasks();
    } catch (err) {
      showFeedback("error", getErrorMessage(err, "Failed to delete user"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Admin Management
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Full system control over tasks, user accounts, and role assignments
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === "tasks"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === "users"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Users ({users.length})
          </button>
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

      {/* Tab 1: Tasks */}
      {activeTab === "tasks" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Filter Status:
              </span>
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              onClick={openCreateTaskModal}
              className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              + Create Task
            </button>
          </div>

          {isLoadingTasks ? (
            <div className="p-8 text-center text-xs text-zinc-600 dark:text-zinc-400">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-600 dark:text-zinc-400">
              No tasks found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Assigned Worker</th>
                    <th className="py-3 px-4">Status</th>
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
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                        {task.client?.name || `Client #${task.client_id}`}
                      </td>
                      <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                        {task.worker ? (
                          <span className="font-medium">{task.worker.name}</span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditTaskModal(task)}
                          className="px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Users */}
      {activeTab === "users" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Filter Role:
              </span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-white focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
                <option value="worker">Worker</option>
              </select>
            </div>

            <button
              onClick={openCreateUserModal}
              className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              + Create User
            </button>
          </div>

          {isLoadingUsers ? (
            <div className="p-8 text-center text-xs text-zinc-600 dark:text-zinc-400">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-600 dark:text-zinc-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                        #{u.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {u.name}
                        {u.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                              : u.role === "client"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditUserModal(u)}
                          className="px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-lg">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Client (Task Owner) *
                </label>
                <select
                  required
                  value={taskForm.client_id}
                  onChange={(e) => setTaskForm({ ...taskForm, client_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="" disabled>Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Assign Worker
                </label>
                <select
                  value={taskForm.worker_id}
                  onChange={(e) => setTaskForm({ ...taskForm, worker_id: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={taskForm.status}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      status: e.target.value as "pending" | "in_progress" | "completed",
                    })
                  }
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-lg">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
              {editingUser ? "Edit User" : "Create New User"}
            </h2>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Password {editingUser ? "(leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? "••••••••" : "At least 6 characters"}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Role *
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      role: e.target.value as "admin" | "client" | "worker",
                    })
                  }
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="client">Client</option>
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
