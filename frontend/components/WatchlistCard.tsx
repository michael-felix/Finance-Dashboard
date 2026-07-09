"use client";

import { MarketCard } from "@/components/MarketCard";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { useCoin } from "@/hooks/useCrypto";
import { useFxRate } from "@/hooks/useFx";
import { useStock } from "@/hooks/useStocks";
import type { WatchlistItem } from "@/types/watchlist";
import { formatCompactCurrency, formatCurrency, formatRate } from "@/utils/format";

interface WatchlistCardProps {
  item: WatchlistItem;
  onRemove: () => void;
}

/** Dispatches to the right data hook for a watchlist entry's asset type, then renders MarketCard. */
export function WatchlistCard({ item, onRemove }: WatchlistCardProps) {
  if (item.type === "stock") return <StockWatchlistCard item={item} onRemove={onRemove} />;
  if (item.type === "crypto") return <CryptoWatchlistCard item={item} onRemove={onRemove} />;
  return <FxWatchlistCard item={item} onRemove={onRemove} />;
}

function StockWatchlistCard({ item, onRemove }: WatchlistCardProps) {
  const { data, isLoading } = useStock(item.id);
  if (isLoading || !data) return <MarketCardSkeleton />;
  return (
    <MarketCard
      href={`/stocks/${data.ticker}`}
      title={data.ticker}
      subtitle={data.name}
      priceLabel={formatCurrency(data.price, data.currency)}
      changePct={data.day_change_pct}
      secondaryChanges={[
        { label: "1W", pct: data.week_change_pct },
        { label: "1M", pct: data.month_change_pct },
      ]}
      sparkline={data.sparkline}
      onRemove={onRemove}
    />
  );
}

function CryptoWatchlistCard({ item, onRemove }: WatchlistCardProps) {
  const { data, isLoading } = useCoin(item.id);
  if (isLoading || !data) return <MarketCardSkeleton />;
  return (
    <MarketCard
      href={`/crypto/${data.id}`}
      title={data.symbol}
      subtitle={data.name}
      priceLabel={formatCurrency(data.price_aud)}
      changePct={data.change_24h_pct}
      secondaryChanges={[{ label: "7D", pct: data.change_7d_pct }]}
      meta={data.market_cap_aud ? `Market cap: ${formatCompactCurrency(data.market_cap_aud)}` : undefined}
      sparkline={data.sparkline}
      onRemove={onRemove}
    />
  );
}

function FxWatchlistCard({ item, onRemove }: WatchlistCardProps) {
  const { data, isLoading } = useFxRate(item.id);
  if (isLoading || !data) return <MarketCardSkeleton />;
  return (
    <MarketCard
      href={`/fx/${data.quote_currency}`}
      title={data.pair}
      subtitle={`1 ${data.base_currency} = ${formatRate(data.rate)} ${data.quote_currency}`}
      priceLabel={formatRate(data.rate)}
      changePct={data.day_change_pct}
      secondaryChanges={[{ label: "1W", pct: data.week_change_pct }]}
      sparkline={data.sparkline}
      onRemove={onRemove}
    />
  );
}
