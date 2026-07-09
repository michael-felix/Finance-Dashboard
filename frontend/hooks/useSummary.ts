import { useQuery } from "@tanstack/react-query";

import { fetchMarketSummary } from "@/services/summary";

export function useMarketSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: fetchMarketSummary,
    refetchInterval: 60_000,
  });
}
