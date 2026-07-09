import { AuthNav } from "@/components/AuthNav";
import { SearchBar } from "@/components/SearchBar";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-surface/80 backdrop-blur dark:border-white/10 dark:bg-surface-dark/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-white dark:bg-brand-dark">
            $
          </div>
          <span className="text-lg font-semibold">AU Finance Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <SearchBar />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
