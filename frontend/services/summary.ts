import { apiClient } from "@/services/api";
import type { MarketSummary } from "@/types/market";

export async function fetchMarketSummary(): Promise<MarketSummary> {
  const { data } = await apiClient.get<MarketSummary>("/summary");
  return data;
}
