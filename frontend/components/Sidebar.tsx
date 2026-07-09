"use client";

import Link from "next/link";

import { useMe } from "@/hooks/useAdmin";

const SECTIONS = [
  { id: "watchlist", label: "My Watchlist" },
  { id: "stocks", label: "ASX Stocks" },
  { id: "fx", label: "FX Rates" },
  { id: "crypto", label: "Cryptocurrency" },
];

/** Section jump-nav for the dashboard, plus an admin dashboard entry point for admins. */
export function Sidebar() {
  const { data: me } = useMe();

  return (
    <nav className="hidden w-48 shrink-0 lg:block">
      <div className="sticky top-20 space-y-0.5">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
          Sections
        </p>
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="block rounded-md border-l-2 border-transparent px-3 py-1.5 text-sm text-ink-secondary transition duration-150 hover:border-brand hover:bg-brand/5 hover:text-ink-primary dark:text-ink-secondary-dark dark:hover:border-brand-dark dark:hover:bg-brand-dark/10 dark:hover:text-ink-primary-dark"
          >
            {section.label}
          </a>
        ))}

        {me?.is_admin && (
          <>
            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
              Admin
            </p>
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-md border-l-2 border-transparent px-3 py-1.5 text-sm text-accent transition duration-150 hover:border-accent hover:bg-accent/5"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden>
                <path
                  d="M10 2l6 2.5v4.7c0 4-2.6 6.9-6 8.3-3.4-1.4-6-4.3-6-8.3V4.5L10 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              Admin Dashboard
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
