"use client";

import Link from "next/link";
import { use, useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { Header } from "@/components/Header";
import { PriceChart } from "@/components/PriceChart";
import { toUserMessage } from "@/services/api";
import { useStock, useStockHistory } from "@/hooks/useStocks";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { ChartRange } from "@/types/market";
import { formatCurrency, formatPercent, formatUpdatedAt } from "@/utils/format";

export default function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const [range, setRange] = useState<ChartRange>("1M");
  const { data, isLoading, isError, error, refetch } = useStock(ticker);
  const history = useStockHistory(ticker, range);
  const { add, remove, has } = useWatchlist();
  const inWatchlist = has("stock", ticker);

  return (
    <div>
      <Header />
      <main className="animate-in mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="link inline-flex items-center gap-1 text-sm">
          &larr; Back to dashboard
        </Link>

        {isLoading && <div className="skeleton h-24 w-full" />}
        {isError && <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />}

        {data && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{data.ticker}</h1>
                <p className="text-ink-secondary dark:text-ink-secondary-dark">{data.name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold tabular-nums">{formatCurrency(data.price, data.currency)}</p>
                <p className={data.day_change_pct >= 0 ? "text-gain dark:text-gain-dark" : "text-loss dark:text-loss-dark"}>
                  {formatPercent(data.day_change_pct)} today
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                inWatchlist
                  ? remove("stock", ticker)
                  : add({ type: "stock", id: ticker, symbol: data.ticker, name: data.name, addedAt: new Date().toISOString() })
              }
              className="btn-secondary"
            >
              {inWatchlist ? "− Remove from watchlist" : "+ Add to watchlist"}
            </button>

            <PriceChart
              range={range}
              onRangeChange={setRange}
              points={history.data?.points ?? []}
              isLoading={history.isLoading}
              isError={history.isError}
              valueFormatter={(v) => formatCurrency(v, data.currency, 0)}
              positive={data.day_change_pct >= 0}
            />

            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Stat label="Day High" value={data.day_high !== null ? formatCurrency(data.day_high, data.currency) : "—"} />
              <Stat label="Day Low" value={data.day_low !== null ? formatCurrency(data.day_low, data.currency) : "—"} />
              <Stat label="1W Change" value={data.week_change_pct !== null ? formatPercent(data.week_change_pct) : "—"} />
              <Stat label="1M Change" value={data.month_change_pct !== null ? formatPercent(data.month_change_pct) : "—"} />
            </dl>

            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Last updated {formatUpdatedAt(data.updated_at)}</p>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 transition duration-150 hover:shadow-sm">
      <dt className="text-xs text-ink-muted dark:text-ink-muted-dark">{label}</dt>
      <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
