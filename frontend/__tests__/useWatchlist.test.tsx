import { act, renderHook } from "@testing-library/react";

import { useWatchlist } from "@/hooks/useWatchlist";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useWatchlist", () => {
  it("adds and removes items, updating state synchronously", () => {
    const { result } = renderHook(() => useWatchlist());

    expect(result.current.items).toEqual([]);

    act(() => {
      result.current.add({ type: "stock", id: "CBA.AX", symbol: "CBA.AX", name: "Commonwealth Bank", addedAt: "now" });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.has("stock", "CBA.AX")).toBe(true);

    act(() => {
      result.current.remove("stock", "CBA.AX");
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.has("stock", "CBA.AX")).toBe(false);
  });

  it("reflects items already in storage on mount", () => {
    window.localStorage.setItem(
      "finance-dashboard:watchlist",
      JSON.stringify([{ type: "crypto", id: "bitcoin", symbol: "BTC", name: "Bitcoin", addedAt: "now" }]),
    );

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.symbol).toBe("BTC");
  });
});
