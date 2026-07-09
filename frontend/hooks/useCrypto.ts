import { useQuery } from "@tanstack/react-query";

import { fetchCoin, fetchCoinHistory, fetchCrypto } from "@/services/crypto";
import type { ChartRange } from "@/types/market";

const REFETCH_INTERVAL_MS = 60_000;

export function useCrypto() {
  return useQuery({
    queryKey: ["crypto"],
    queryFn: fetchCrypto,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useCoin(coinId: string) {
  return useQuery({
    queryKey: ["coin", coinId],
    queryFn: () => fetchCoin(coinId),
    refetchInterval: REFETCH_INTERVAL_MS,
    enabled: Boolean(coinId),
  });
}

export function useCoinHistory(coinId: string, range: ChartRange) {
  return useQuery({
    queryKey: ["coin-history", coinId, range],
    queryFn: () => fetchCoinHistory(coinId, range),
    enabled: Boolean(coinId),
    staleTime: 60_000,
  });
}
