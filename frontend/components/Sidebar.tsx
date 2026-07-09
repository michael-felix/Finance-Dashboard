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
      <div className="sticky top-20 space-y-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Sections</p>
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="block rounded-md px-3 py-1.5 text-sm text-ink-secondary transition hover:bg-black/5 hover:text-ink-primary dark:text-ink-secondary-dark dark:hover:bg-white/5 dark:hover:text-ink-primary-dark"
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
