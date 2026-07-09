import { apiClient } from "@/services/api";
import type { ChartRange, StockHistoryResponse, StockListResponse, StockQuote } from "@/types/market";

export async function fetchStocks(): Promise<StockListResponse> {
  const { data } = await apiClient.get<StockListResponse>("/stocks");
  return data;
}

export async function fetchStock(ticker: string): Promise<StockQuote> {
  const { data } = await apiClient.get<StockQuote>(`/stocks/${ticker}`);
  return data;
}

export async function fetchStockHistory(ticker: string, range: ChartRange): Promise<StockHistoryResponse> {
  const { data } = await apiClient.get<StockHistoryResponse>(`/stocks/${ticker}/history`, {
    params: { range },
  });
  return data;
}
