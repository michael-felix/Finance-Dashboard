"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, signUp } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      setInfo("Account created. Check your email to confirm, then sign in.");
      setMode("sign-in");
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-sm px-4 py-16 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold">{mode === "sign-in" ? "Sign in" : "Create an account"}</h1>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm outline-none ring-brand/40 focus:ring-2 dark:border-white/10 dark:bg-surface-dark"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm outline-none ring-brand/40 focus:ring-2 dark:border-white/10 dark:bg-surface-dark"
            />
          </div>

          {error && <p className="text-sm text-loss dark:text-loss-dark">{error}</p>}
          {info && <p className="text-sm text-gain dark:text-gain-dark">{info}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-brand-dark"
          >
            {submitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-secondary dark:text-ink-secondary-dark">
          {mode === "sign-in" ? (
            <>
              No account?{" "}
              <button type="button" onClick={() => setMode("sign-up")} className="text-brand hover:underline dark:text-brand-dark">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("sign-in")} className="text-brand hover:underline dark:text-brand-dark">
                Sign in
              </button>
            </>
          )}
        </p>

        <p className="mt-2 text-center text-sm">
          <Link href="/" className="text-brand hover:underline dark:text-brand-dark">
            &larr; Back to dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
