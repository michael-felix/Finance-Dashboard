"use client";

import Link from "next/link";
import { use, useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { Header } from "@/components/Header";
import { PriceChart } from "@/components/PriceChart";
import { toUserMessage } from "@/services/api";
import { useFxHistory, useFxRate } from "@/hooks/useFx";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { ChartRange } from "@/types/market";
import { formatPercent, formatRate, formatUpdatedAt } from "@/utils/format";

export default function FxDetailPage({ params }: { params: Promise<{ currency: string }> }) {
  const { currency } = use(params);
  const [range, setRange] = useState<ChartRange>("1M");
  const { data, isLoading, isError, error, refetch } = useFxRate(currency);
  const history = useFxHistory(currency, range);
  const { add, remove, has } = useWatchlist();
  const inWatchlist = has("fx", currency);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-brand hover:underline dark:text-brand-dark">
          &larr; Back to dashboard
        </Link>

        {isLoading && <div className="skeleton h-24 w-full" />}
        {isError && <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />}

        {data && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{data.pair}</h1>
                <p className="text-ink-secondary dark:text-ink-secondary-dark">
                  1 {data.base_currency} = {formatRate(data.rate)} {data.quote_currency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold tabular-nums">{formatRate(data.rate)}</p>
                {data.day_change_pct !== null && (
                  <p className={data.day_change_pct >= 0 ? "text-gain dark:text-gain-dark" : "text-loss dark:text-loss-dark"}>
                    {formatPercent(data.day_change_pct)} today
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                inWatchlist
                  ? remove("fx", currency)
                  : add({
                      type: "fx",
                      id: currency,
                      symbol: data.quote_currency,
                      name: data.pair,
                      addedAt: new Date().toISOString(),
                    })
              }
              className="rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              {inWatchlist ? "− Remove from watchlist" : "+ Add to watchlist"}
            </button>

            <PriceChart
              range={range}
              onRangeChange={setRange}
              points={history.data?.points ?? []}
              isLoading={history.isLoading}
              isError={history.isError}
              valueFormatter={(v) => formatRate(v, 4)}
              positive={(data.day_change_pct ?? 0) >= 0}
            />

            <p className="text-xs text-ink-muted">Last updated {formatUpdatedAt(data.updated_at)}</p>
          </>
        )}
      </main>
    </div>
  );
}
