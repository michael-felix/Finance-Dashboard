export function Footer() {
  return (
    <footer className="border-t border-border bg-surface dark:border-border-dark dark:bg-surface-dark">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:px-6 lg:px-8 dark:text-ink-muted-dark">
        <p>
          Data from Yahoo Finance, CoinGecko &amp; Open Exchange Rates. Not financial advice.
        </p>
        <p>
          Built by <span className="font-medium text-ink-secondary dark:text-ink-secondary-dark">Michael Lim</span>
        </p>
      </div>
    </footer>
  );
}
