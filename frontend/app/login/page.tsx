"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api";

const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin (Mohamed)", email: "admin@example.com", desc: "Full system access & user management" },
  { role: "client", label: "Client 1 (Fatima)", email: "client1@example.com", desc: "Can create & manage own tasks" },
  { role: "client", label: "Client 2 (Omar)", email: "client2@example.com", desc: "Can create & manage own tasks" },
  { role: "worker", label: "Worker 1 (Karim)", email: "worker1@example.com", desc: "Can view & update assigned tasks" },
  { role: "worker", label: "Worker 2 (Sara)", email: "worker2@example.com", desc: "Can view & update assigned tasks" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, "Failed to authenticate. Please check your credentials."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillAndLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password");
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(demoEmail, "password");
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, "Login failed for demo account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-lg items-center justify-center shadow-xs">
          TM
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Sign in to your account
        </h1>
        <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          User & Task Management Application
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-8 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-lg text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
              >
                Email Address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-2xs placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-2xs placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-60 cursor-pointer transition-colors"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-3 flex items-center justify-between">
              <span>Instant Login</span>
              <span className="text-[11px] font-normal lowercase tracking-normal text-zinc-600 dark:text-zinc-400 italic">
                (to make your life easier)
              </span>
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillAndLogin(acc.email)}
                  disabled={isSubmitting}
                  className="w-full text-left px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span>{acc.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded font-mono uppercase">
                        {acc.role}
                      </span>
                    </div>
                    <div className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-0.5">
                      {acc.desc}
                    </div>
                  </div>
                  <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white text-xs font-medium">
                    Select &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
