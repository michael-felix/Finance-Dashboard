import { useQuery } from "@tanstack/react-query";

import { fetchFxHistory, fetchFxRate, fetchFxRates } from "@/services/fx";
import type { ChartRange } from "@/types/market";

const REFETCH_INTERVAL_MS = 60_000;

export function useFxRates() {
  return useQuery({
    queryKey: ["fx"],
    queryFn: fetchFxRates,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useFxRate(currency: string) {
  return useQuery({
    queryKey: ["fx-rate", currency],
    queryFn: () => fetchFxRate(currency),
    refetchInterval: REFETCH_INTERVAL_MS,
    enabled: Boolean(currency),
  });
}

export function useFxHistory(currency: string, range: ChartRange) {
  return useQuery({
    queryKey: ["fx-history", currency, range],
    queryFn: () => fetchFxHistory(currency, range),
    enabled: Boolean(currency),
    staleTime: 60_000,
  });
}
