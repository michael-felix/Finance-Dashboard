"use client";

import Link from "next/link";

import { ErrorState } from "@/components/ErrorState";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useMe } from "@/hooks/useAdmin";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/assets", label: "Tracked Assets" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/jobs", label: "Scheduler Jobs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: me, isLoading: meLoading, isError } = useMe();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {(authLoading || (user && meLoading)) && <div className="skeleton h-32 w-full" />}

        {!authLoading && !user && (
          <ErrorState message="Sign in to access the admin dashboard." />
        )}

        {!authLoading && user && !meLoading && (isError || !me?.is_admin) && (
          <ErrorState message="You don't have permission to view this page." />
        )}

        {!authLoading && user && !meLoading && me?.is_admin && (
          <div className="flex flex-col gap-8 lg:flex-row">
            <nav className="flex shrink-0 gap-2 overflow-x-auto lg:w-48 lg:flex-col">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-secondary transition hover:bg-black/5 hover:text-ink-primary dark:text-ink-secondary-dark dark:hover:bg-white/5 dark:hover:text-ink-primary-dark"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        )}
      </main>
    </div>
  );
}
