import Link from "next/link";

import { AuthNav } from "@/components/AuthNav";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-nav-border bg-nav">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 py-1 pr-2">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
            <path
              d="M4 17l5-6 4 3 7-9"
              stroke="#f48024"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M15 5h5v5" stroke="#f48024" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden text-[15px] font-bold tracking-tight text-white sm:inline">
            AU Finance
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
