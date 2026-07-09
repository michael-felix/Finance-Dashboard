import { apiClient } from "@/services/api";
import type { ChartRange, FxHistoryResponse, FxListResponse, FxQuote } from "@/types/market";

export async function fetchFxRates(): Promise<FxListResponse> {
  const { data } = await apiClient.get<FxListResponse>("/fx");
  return data;
}

export async function fetchFxRate(currency: string): Promise<FxQuote> {
  const { data } = await apiClient.get<FxQuote>(`/fx/${currency}`);
  return data;
}

export async function fetchFxHistory(currency: string, range: ChartRange): Promise<FxHistoryResponse> {
  const { data } = await apiClient.get<FxHistoryResponse>(`/fx/${currency}/history`, {
    params: { range },
  });
  return data;
}
