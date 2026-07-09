import type { AssetType } from "@/types/search";
import type { WatchlistItem, WatchlistStore } from "@/types/watchlist";

const STORAGE_KEY = "finance-dashboard:watchlist";

function readRaw(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

function writeRaw(items: WatchlistItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // Notify listeners in the same tab — the native `storage` event only fires cross-tab.
  window.dispatchEvent(new Event("watchlist-change"));
}

class LocalStorageWatchlistStore implements WatchlistStore {
  getAll(): WatchlistItem[] {
    return readRaw();
  }

  add(item: WatchlistItem): WatchlistItem[] {
    const current = readRaw();
    if (current.some((i) => i.type === item.type && i.id === item.id)) return current;
    const next = [...current, item];
    writeRaw(next);
    return next;
  }

  remove(type: AssetType, id: string): WatchlistItem[] {
    const next = readRaw().filter((i) => !(i.type === type && i.id === id));
    writeRaw(next);
    return next;
  }

  has(type: AssetType, id: string): boolean {
    return readRaw().some((i) => i.type === type && i.id === id);
  }
}

export const watchlistStore: WatchlistStore = new LocalStorageWatchlistStore();
export const WATCHLIST_CHANGE_EVENT = "watchlist-change";
export const WATCHLIST_STORAGE_KEY = STORAGE_KEY;
