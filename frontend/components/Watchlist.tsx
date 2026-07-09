"use client";

import { WatchlistCard } from "@/components/WatchlistCard";
import { useWatchlist } from "@/hooks/useWatchlist";

export function Watchlist() {
  const { items, remove } = useWatchlist();

  if (items.length === 0) {
    return (
      <section id="watchlist" className="scroll-mt-24">
        <h2 className="mb-4 text-xl font-semibold">My Watchlist</h2>
        <div className="card p-6 text-center text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Use the search bar above to add stocks, crypto, or FX pairs to your watchlist.
        </div>
      </section>
    );
  }

  return (
    <section id="watchlist" className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold">My Watchlist</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <WatchlistCard
            key={`${item.type}-${item.id}`}
            item={item}
            onRemove={() => remove(item.type, item.id)}
          />
        ))}
      </div>
    </section>
  );
}
