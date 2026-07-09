"use client";

import { useMarketSummary } from "@/hooks/useSummary";
import { formatPercent } from "@/utils/format";

const CRYPTO_DIRECTION_LABEL: Record<string, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

const AUD_INDICATOR_LABEL: Record<string, string> = {
  strengthening: "Strengthening",
  weakening: "Weakening",
  stable: "Stable",
};

function Tile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "gain" | "loss" | "neutral";
}) {
  const toneClass =
    tone === "gain"
      ? "text-gain dark:text-gain-dark"
      : tone === "loss"
        ? "text-loss dark:text-loss-dark"
        : "text-ink-primary dark:text-ink-primary-dark";

  const barClass = tone === "gain" ? "bg-gain dark:bg-gain-dark" : tone === "loss" ? "bg-loss dark:bg-loss-dark" : "bg-brand dark:bg-brand-dark";

  return (
    <div className="card relative flex-1 overflow-hidden p-4 pl-5 transition duration-150 hover:shadow-md">
      <span className={`absolute inset-y-0 left-0 w-1 ${barClass}`} aria-hidden />
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
      {detail && <p className="text-xs text-ink-muted dark:text-ink-muted-dark">{detail}</p>}
    </div>
  );
}

function BannerSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-2 h-6 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Top-of-dashboard summary: strongest/weakest ASX performer, crypto direction, AUD strength. */
export function SummaryBanner() {
  const { data, isLoading, isError } = useMarketSummary();

  if (isLoading) return <BannerSkeleton />;
  if (isError || !data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        label="Strongest ASX Performer"
        value={data.strongest_stock ? data.strongest_stock.symbol : "—"}
        detail={data.strongest_stock ? formatPercent(data.strongest_stock.change_pct) : undefined}
        tone="gain"
      />
      <Tile
        label="Weakest ASX Performer"
        value={data.weakest_stock ? data.weakest_stock.symbol : "—"}
        detail={data.weakest_stock ? formatPercent(data.weakest_stock.change_pct) : undefined}
        tone="loss"
      />
      <Tile
        label="Crypto Market"
        value={CRYPTO_DIRECTION_LABEL[data.crypto_market_direction] ?? data.crypto_market_direction}
        detail={`Avg 24h: ${formatPercent(data.crypto_average_change_pct)}`}
        tone={data.crypto_average_change_pct >= 0 ? "gain" : "loss"}
      />
      <Tile
        label="AUD Strength"
        value={AUD_INDICATOR_LABEL[data.aud_strength_indicator] ?? data.aud_strength_indicator}
        detail={`Avg change: ${formatPercent(data.aud_average_change_pct)}`}
        tone={data.aud_average_change_pct >= 0 ? "gain" : "loss"}
      />
    </div>
  );
}
