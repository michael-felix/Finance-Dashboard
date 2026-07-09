"use client";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/hooks/useAdmin";

/** Sign-in link or the signed-in user's avatar + admin link + sign-out, shown in the header. */
export function AuthNav() {
  const { user, isLoading, signOut } = useAuth();
  const { data: me } = useMe();

  if (isLoading) return <div className="h-8 w-20" />;

  if (!user) {
    return (
      <Link href="/login" className="btn-primary">
        Sign in
      </Link>
    );
  }

  const initial = user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex items-center gap-2">
      {me?.is_admin && (
        <Link
          href="/admin"
          className="hidden rounded-md border border-accent/40 px-2.5 py-1 text-xs font-semibold text-accent transition duration-150 hover:bg-accent/10 active:scale-95 sm:inline-block"
        >
          Admin
        </Link>
      )}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
        {initial}
      </div>
      <span className="hidden max-w-[9rem] truncate text-sm text-white/80 md:inline">{user.email}</span>
      <button
        type="button"
        onClick={() => signOut()}
        aria-label="Sign out"
        title="Sign out"
        className="flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition duration-150 hover:bg-white/10 hover:text-white active:scale-90"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M7.5 17.5H4a1 1 0 01-1-1v-13a1 1 0 011-1h3.5M13 14l4-4-4-4M17 10H7.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
