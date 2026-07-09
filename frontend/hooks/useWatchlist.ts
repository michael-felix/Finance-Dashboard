import { useCallback, useEffect, useState } from "react";

import { WATCHLIST_CHANGE_EVENT, WATCHLIST_STORAGE_KEY, watchlistStore } from "@/services/watchlistStore";
import type { AssetType } from "@/types/search";
import type { WatchlistItem } from "@/types/watchlist";

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    setItems(watchlistStore.getAll());

    const sync = () => setItems(watchlistStore.getAll());
    const onStorage = (e: StorageEvent) => {
      if (e.key === WATCHLIST_STORAGE_KEY) sync();
    };

    window.addEventListener(WATCHLIST_CHANGE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(WATCHLIST_CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const add = useCallback((item: WatchlistItem) => setItems(watchlistStore.add(item)), []);
  const remove = useCallback(
    (type: AssetType, id: string) => setItems(watchlistStore.remove(type, id)),
    [],
  );
  const has = useCallback((type: AssetType, id: string) => items.some((i) => i.type === type && i.id === id), [items]);

  return { items, add, remove, has };
}
