"use client";

import { MarketCard } from "@/components/MarketCard";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { toUserMessage } from "@/services/api";
import { useFxRates } from "@/hooks/useFx";
import { formatRate } from "@/utils/format";

export function FxSection() {
  const { data, isLoading, isError, error, refetch } = useFxRates();

  return (
    <section id="fx" className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold">FX Rates</h2>
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      )}
      {isError && <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((fx) => (
            <MarketCard
              key={fx.pair}
              href={`/fx/${fx.quote_currency}`}
              title={fx.pair}
              subtitle={`1 ${fx.base_currency} = ${formatRate(fx.rate)} ${fx.quote_currency}`}
              priceLabel={formatRate(fx.rate)}
              changePct={fx.day_change_pct}
              secondaryChanges={[{ label: "1W", pct: fx.week_change_pct }]}
              sparkline={fx.sparkline}
            />
          ))}
        </div>
      )}
      {data && data.items.length === 0 && (
        <ErrorState message="FX rates are temporarily unavailable — the free-tier provider may be rate-limited or missing an API key." />
      )}
    </section>
  );
}
