/** Mirrors the Pydantic response schemas defined in backend/app/schemas/. */

export type ChartRange = "1D" | "1W" | "1M" | "3M";

export interface PricePoint {
  timestamp: string;
  value: number;
}

export interface StockQuote {
  ticker: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  day_change: number;
  day_change_pct: number;
  week_change_pct: number | null;
  month_change_pct: number | null;
  day_high: number | null;
  day_low: number | null;
  volume: number | null;
  sparkline: PricePoint[];
  updated_at: string;
}

export interface StockListResponse {
  items: StockQuote[];
  count: number;
}

export interface StockHistoryResponse {
  ticker: string;
  range: ChartRange;
  points: PricePoint[];
}

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  price_aud: number;
  market_cap_aud: number | null;
  volume_24h_aud: number | null;
  change_24h_pct: number | null;
  change_7d_pct: number | null;
  sparkline: PricePoint[];
  updated_at: string;
}

export interface CryptoListResponse {
  items: CryptoQuote[];
  count: number;
}

export interface CryptoHistoryResponse {
  id: string;
  range: ChartRange;
  points: PricePoint[];
}

export interface FxQuote {
  base_currency: string;
  quote_currency: string;
  pair: string;
  rate: number;
  day_change_pct: number | null;
  week_change_pct: number | null;
  sparkline: PricePoint[];
  updated_at: string;
}

export interface FxListResponse {
  items: FxQuote[];
  count: number;
}

export interface FxHistoryResponse {
  pair: string;
  range: ChartRange;
  points: PricePoint[];
}

export interface TopMover {
  symbol: string;
  name: string;
  change_pct: number;
  price: number;
}

export interface MarketSummary {
  strongest_stock: TopMover | null;
  weakest_stock: TopMover | null;
  crypto_market_direction: "bullish" | "bearish" | "neutral";
  crypto_average_change_pct: number;
  aud_strength_indicator: "strengthening" | "weakening" | "stable";
  aud_average_change_pct: number;
  generated_at: string;
}
