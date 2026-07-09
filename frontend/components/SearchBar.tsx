"use client";

import { useEffect, useRef, useState } from "react";

import { useSearch } from "@/hooks/useSearch";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { AssetType, SearchResult } from "@/types/search";

const TYPE_LABEL: Record<AssetType, string> = {
  stock: "Stocks",
  crypto: "Crypto",
  fx: "FX",
};

function toWatchlistId(result: SearchResult): string {
  // Crypto must be keyed by CoinGecko id (the API identifier), not the display symbol.
  return result.type === "crypto" ? (result.subtitle ?? result.symbol) : result.symbol;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isFetching } = useSearch(query);
  const { add, has } = useWatchlist();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const groups: Record<AssetType, SearchResult[]> = { stock: [], crypto: [], fx: [] };
  for (const result of data?.items ?? []) groups[result.type].push(result);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search stocks, crypto, FX…"
        className="w-full rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm outline-none ring-brand/40 transition focus:ring-2 dark:border-white/10 dark:bg-surface-dark"
        aria-label="Search stocks, crypto, and FX pairs"
      />

      {open && query.trim().length > 0 && (
        <div className="card absolute left-0 right-0 top-full z-20 mt-1 max-h-96 overflow-y-auto p-2">
          {isFetching && <p className="px-2 py-1.5 text-xs text-ink-muted">Searching…</p>}
          {!isFetching && (data?.items.length ?? 0) === 0 && (
            <p className="px-2 py-1.5 text-xs text-ink-muted">No matches for &ldquo;{query}&rdquo;</p>
          )}
          {(Object.keys(groups) as AssetType[]).map((type) =>
            groups[type].length > 0 ? (
              <div key={type} className="mb-1 last:mb-0">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {TYPE_LABEL[type]}
                </p>
                {groups[type].map((result) => {
                  const id = toWatchlistId(result);
                  const added = has(result.type, id);
                  return (
                    <div
                      key={`${result.type}-${id}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{result.symbol}</p>
                        <p className="truncate text-xs text-ink-muted">{result.name}</p>
                      </div>
                      <button
                        type="button"
                        disabled={added}
                        onClick={() =>
                          add({ type: result.type, id, symbol: result.symbol, name: result.name, addedAt: new Date().toISOString() })
                        }
                        className="shrink-0 rounded-md bg-brand px-2 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-dark"
                      >
                        {added ? "Added" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
