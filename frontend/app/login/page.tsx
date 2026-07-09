"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

type Mode = "sign-in" | "sign-up";

// Pre-provisioned read-only accounts so reviewers can see the app (incl. the admin
// dashboard) without signing up. These must actually exist in Supabase — see README.
const DEMO_ACCOUNTS = {
  user: { email: "demo@findash.app", password: "DemoUser123!" },
  admin: { email: "admin@findash.app", password: "DemoAdmin123!" },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"user" | "admin" | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const result = mode === "sign-in" ? await signInWithPassword(email, password) : await signUp(email, password);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === "sign-up") {
      setInfo("Account created — check your email to confirm, then sign in.");
      setMode("sign-in");
      return;
    }
    router.push("/");
  }

  async function handleDemoLogin(kind: "user" | "admin") {
    setError(null);
    setInfo(null);
    setDemoLoading(kind);
    const { email: demoEmail, password: demoPassword } = DEMO_ACCOUNTS[kind];
    const result = await signInWithPassword(demoEmail, demoPassword);
    setDemoLoading(null);
    if (result.error) {
      setError(`Demo account unavailable: ${result.error}`);
      return;
    }
    router.push(kind === "admin" ? "/admin" : "/");
  }

  return (
    <div>
      <Header />
      <main className="flex min-h-[calc(100vh-52px)] items-center justify-center bg-page px-4 py-12 dark:bg-page-dark">
        <div className="animate-in w-full max-w-sm">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                <path
                  d="M4 17l5-6 4 3 7-9"
                  stroke="#f48024"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M15 5h5v5" stroke="#f48024" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Welcome to AU Finance</h1>
            <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
              Track ASX stocks, crypto, and FX in one place.
            </p>
          </div>

          <div className="card p-6">
            <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-md bg-page p-1 dark:bg-page-dark">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sign-in"}
                onClick={() => switchMode("sign-in")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition duration-150 active:scale-95 ${
                  mode === "sign-in"
                    ? "bg-surface text-ink-primary shadow-sm dark:bg-surface-dark dark:text-ink-primary-dark"
                    : "text-ink-muted hover:text-ink-primary dark:text-ink-muted-dark dark:hover:text-ink-primary-dark"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "sign-up"}
                onClick={() => switchMode("sign-up")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition duration-150 active:scale-95 ${
                  mode === "sign-up"
                    ? "bg-surface text-ink-primary shadow-sm dark:bg-surface-dark dark:text-ink-primary-dark"
                    : "text-ink-muted hover:text-ink-primary dark:text-ink-muted-dark dark:hover:text-ink-primary-dark"
                }`}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="animate-in rounded-md bg-loss/10 px-3 py-2 text-sm text-loss dark:bg-loss-dark/10 dark:text-loss-dark">
                  {error}
                </p>
              )}
              {info && (
                <p className="animate-in rounded-md bg-gain/10 px-3 py-2 text-sm text-gain dark:bg-gain-dark/10 dark:text-gain-dark">
                  {info}
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full py-2">
                {submitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border dark:bg-border-dark" />
              <span className="text-xs text-ink-muted dark:text-ink-muted-dark">or try the demo</span>
              <div className="h-px flex-1 bg-border dark:bg-border-dark" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin("user")}
                className="btn-secondary text-xs"
              >
                {demoLoading === "user" ? "Signing in…" : "Guest demo"}
              </button>
              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin("admin")}
                className="btn-secondary text-xs"
              >
                {demoLoading === "admin" ? "Signing in…" : "Admin demo"}
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-ink-muted dark:text-ink-muted-dark">
            By continuing you agree this is a portfolio demo, not real financial advice.
          </p>
        </div>
      </main>
    </div>
  );
}
