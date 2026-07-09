"use client";

import { MarketCard } from "@/components/MarketCard";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { toUserMessage } from "@/services/api";
import { useCrypto } from "@/hooks/useCrypto";
import { formatCompactCurrency, formatCurrency } from "@/utils/format";

export function CryptoSection() {
  const { data, isLoading, isError, error, refetch } = useCrypto();

  return (
    <section id="crypto" className="scroll-mt-24">
      <h2 className="section-heading">Cryptocurrency</h2>
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      )}
      {isError && <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((coin) => (
            <MarketCard
              key={coin.id}
              href={`/crypto/${coin.id}`}
              title={coin.symbol}
              subtitle={coin.name}
              priceLabel={formatCurrency(coin.price_aud)}
              changePct={coin.change_24h_pct}
              secondaryChanges={[{ label: "7D", pct: coin.change_7d_pct }]}
              meta={coin.market_cap_aud ? `Market cap: ${formatCompactCurrency(coin.market_cap_aud)}` : undefined}
              sparkline={coin.sparkline}
            />
          ))}
        </div>
      )}
    </section>
  );
}
