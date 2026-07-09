export interface TrackedStock {
  ticker: string;
  name: string;
}

export interface TrackedCrypto {
  coingecko_id: string;
  symbol: string;
  name: string;
}

export interface TrackedFx {
  quote_currency: string;
}

export interface TrackedAssetsResponse {
  stocks: TrackedStock[];
  crypto: TrackedCrypto[];
  fx: TrackedFx[];
}

export interface SchedulerRun {
  id: number;
  started_at: string;
  finished_at: string;
  stocks_stored: number;
  crypto_stored: number;
  fx_stored: number;
  success: boolean;
  error_message: string | null;
  triggered_by: string;
}

export interface SchedulerRunListResponse {
  items: SchedulerRun[];
}
