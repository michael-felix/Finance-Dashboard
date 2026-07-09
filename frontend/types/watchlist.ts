import type { AssetType } from "@/types/search";

export interface WatchlistItem {
  type: AssetType;
  /** The API identifier: ASX ticker, CoinGecko coin id, or currency code. Used in API calls. */
  id: string;
  /** Short display symbol shown on cards (e.g. "SOL" for crypto, where `id` is "solana"). */
  symbol: string;
  name: string;
  addedAt: string;
}

/**
 * Storage abstraction for the watchlist. `LocalStorageWatchlistStore` is the only
 * implementation today; swapping to a backend-persisted watchlist once auth exists
 * (see Phase 6) means implementing this same interface against the API instead of
 * `localStorage` — nothing else in the app needs to change.
 */
export interface WatchlistStore {
  getAll(): WatchlistItem[];
  add(item: WatchlistItem): WatchlistItem[];
  remove(type: AssetType, id: string): WatchlistItem[];
  has(type: AssetType, id: string): boolean;
}
