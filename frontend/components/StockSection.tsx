"use client";

import { MarketCard } from "@/components/MarketCard";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { toUserMessage } from "@/services/api";
import { useStocks } from "@/hooks/useStocks";
import { formatCurrency } from "@/utils/format";

export function StockSection() {
  const { data, isLoading, isError, error, refetch } = useStocks();

  return (
    <section id="stocks" className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold">ASX Stocks</h2>
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      )}
      {isError && <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((stock) => (
            <MarketCard
              key={stock.ticker}
              href={`/stocks/${stock.ticker}`}
              title={stock.ticker}
              subtitle={stock.name}
              priceLabel={formatCurrency(stock.price, stock.currency)}
              changePct={stock.day_change_pct}
              secondaryChanges={[
                { label: "1W", pct: stock.week_change_pct },
                { label: "1M", pct: stock.month_change_pct },
              ]}
              sparkline={stock.sparkline}
            />
          ))}
        </div>
      )}
    </section>
  );
}
