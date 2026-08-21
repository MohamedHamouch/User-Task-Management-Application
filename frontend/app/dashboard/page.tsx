"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/AdminDashboard";
import ClientDashboard from "@/components/ClientDashboard";
import WorkerDashboard from "@/components/WorkerDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {user?.role === "admin" && <AdminDashboard />}
          {user?.role === "client" && <ClientDashboard />}
          {user?.role === "worker" && <WorkerDashboard />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
