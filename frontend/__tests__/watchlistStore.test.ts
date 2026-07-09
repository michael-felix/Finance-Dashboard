import { watchlistStore } from "@/services/watchlistStore";
import type { WatchlistItem } from "@/types/watchlist";

const btc: WatchlistItem = { type: "crypto", id: "bitcoin", symbol: "BTC", name: "Bitcoin", addedAt: "2026-01-01" };
const cba: WatchlistItem = { type: "stock", id: "CBA.AX", symbol: "CBA.AX", name: "Commonwealth Bank", addedAt: "2026-01-01" };

beforeEach(() => {
  window.localStorage.clear();
});

describe("watchlistStore", () => {
  it("starts empty", () => {
    expect(watchlistStore.getAll()).toEqual([]);
  });

  it("adds an item and persists it", () => {
    watchlistStore.add(btc);
    expect(watchlistStore.getAll()).toEqual([btc]);
  });

  it("does not add a duplicate of the same type+id", () => {
    watchlistStore.add(btc);
    watchlistStore.add(btc);
    expect(watchlistStore.getAll()).toHaveLength(1);
  });

  it("allows the same id across different asset types", () => {
    const fxUsd: WatchlistItem = { type: "fx", id: "bitcoin", symbol: "BTC", name: "not actually crypto", addedAt: "2026-01-01" };
    watchlistStore.add(btc);
    watchlistStore.add(fxUsd);
    expect(watchlistStore.getAll()).toHaveLength(2);
  });

  it("removes an item by type and id", () => {
    watchlistStore.add(btc);
    watchlistStore.add(cba);
    watchlistStore.remove("crypto", "bitcoin");
    expect(watchlistStore.getAll()).toEqual([cba]);
  });

  it("has() reflects current membership", () => {
    expect(watchlistStore.has("crypto", "bitcoin")).toBe(false);
    watchlistStore.add(btc);
    expect(watchlistStore.has("crypto", "bitcoin")).toBe(true);
  });
});
