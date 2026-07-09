import { apiClient } from "@/services/api";
import type { ChartRange, CryptoHistoryResponse, CryptoListResponse, CryptoQuote } from "@/types/market";

export async function fetchCrypto(): Promise<CryptoListResponse> {
  const { data } = await apiClient.get<CryptoListResponse>("/crypto");
  return data;
}

export async function fetchCoin(coinId: string): Promise<CryptoQuote> {
  const { data } = await apiClient.get<CryptoQuote>(`/crypto/${coinId}`);
  return data;
}

export async function fetchCoinHistory(coinId: string, range: ChartRange): Promise<CryptoHistoryResponse> {
  const { data } = await apiClient.get<CryptoHistoryResponse>(`/crypto/${coinId}/history`, {
    params: { range },
  });
  return data;
}
