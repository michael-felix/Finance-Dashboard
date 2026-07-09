import { useQuery } from "@tanstack/react-query";

import { fetchStock, fetchStockHistory, fetchStocks } from "@/services/stocks";
import type { ChartRange } from "@/types/market";

const REFETCH_INTERVAL_MS = 60_000;

export function useStocks() {
  return useQuery({
    queryKey: ["stocks"],
    queryFn: fetchStocks,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useStock(ticker: string) {
  return useQuery({
    queryKey: ["stock", ticker],
    queryFn: () => fetchStock(ticker),
    refetchInterval: REFETCH_INTERVAL_MS,
    enabled: Boolean(ticker),
  });
}

export function useStockHistory(ticker: string, range: ChartRange) {
  return useQuery({
    queryKey: ["stock-history", ticker, range],
    queryFn: () => fetchStockHistory(ticker, range),
    enabled: Boolean(ticker),
    staleTime: 60_000,
  });
}
