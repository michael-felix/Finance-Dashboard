const SECTIONS = [
  { id: "watchlist", label: "My Watchlist" },
  { id: "stocks", label: "ASX Stocks" },
  { id: "fx", label: "FX Rates" },
  { id: "crypto", label: "Cryptocurrency" },
];

/** Section jump-nav for the dashboard. */
export function Sidebar() {
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
      </div>
    </nav>
  );
}
