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
    <div ref={containerRef} className="relative w-full max-w-md">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
        aria-hidden
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
        <path d="M17 17l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search stocks, crypto, FX…"
        className="w-full rounded-md border border-white/15 bg-white/10 py-1.5 pl-8 pr-3 text-sm text-white outline-none transition duration-150 placeholder:text-white/40 focus:border-brand-dark focus:bg-surface-dark focus:ring-2 focus:ring-brand-dark/40"
        aria-label="Search stocks, crypto, and FX pairs"
      />

      {open && query.trim().length > 0 && (
        <div className="card animate-in absolute left-0 right-0 top-full z-30 mt-1.5 max-h-96 overflow-y-auto p-2 shadow-lg">
          {isFetching && <p className="px-2 py-1.5 text-xs text-ink-muted dark:text-ink-muted-dark">Searching…</p>}
          {!isFetching && (data?.items.length ?? 0) === 0 && (
            <p className="px-2 py-1.5 text-xs text-ink-muted dark:text-ink-muted-dark">
              No matches for &ldquo;{query}&rdquo;
            </p>
          )}
          {(Object.keys(groups) as AssetType[]).map((type) =>
            groups[type].length > 0 ? (
              <div key={type} className="mb-1 last:mb-0">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
                  {TYPE_LABEL[type]}
                </p>
                {groups[type].map((result) => {
                  const id = toWatchlistId(result);
                  const added = has(result.type, id);
                  return (
                    <div
                      key={`${result.type}-${id}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition hover:bg-page dark:hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{result.symbol}</p>
                        <p className="truncate text-xs text-ink-muted dark:text-ink-muted-dark">{result.name}</p>
                      </div>
                      <button
                        type="button"
                        disabled={added}
                        onClick={() =>
                          add({
                            type: result.type,
                            id,
                            symbol: result.symbol,
                            name: result.name,
                            addedAt: new Date().toISOString(),
                          })
                        }
                        className="btn-primary shrink-0 px-2 py-1 text-xs"
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
