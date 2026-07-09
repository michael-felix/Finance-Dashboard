"use client";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/hooks/useAdmin";

/** Sign-in link or the signed-in user's email + admin link + sign-out, shown in the header. */
export function AuthNav() {
  const { user, isLoading, signOut } = useAuth();
  const { data: me } = useMe();

  if (isLoading) return <div className="h-8 w-20" />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-brand-dark"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      {me?.is_admin && (
        <Link href="/admin" className="text-brand hover:underline dark:text-brand-dark">
          Admin
        </Link>
      )}
      <span className="hidden text-ink-muted sm:inline">{user.email}</span>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-md border border-black/10 px-3 py-1.5 font-medium transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
      >
        Sign out
      </button>
    </div>
  );
}
