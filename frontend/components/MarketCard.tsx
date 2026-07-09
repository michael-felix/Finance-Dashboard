import Link from "next/link";

import { SparklineChart } from "@/components/SparklineChart";
import type { PricePoint } from "@/types/market";
import { formatPercent } from "@/utils/format";

interface MarketCardProps {
  href: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  changePct: number | null;
  secondaryChanges?: { label: string; pct: number | null }[];
  sparkline: PricePoint[];
  meta?: string;
  onRemove?: () => void;
}

/** Generic price card used for ASX stocks, crypto, and FX pairs on the dashboard. */
export function MarketCard({
  href,
  title,
  subtitle,
  priceLabel,
  changePct,
  secondaryChanges = [],
  sparkline,
  meta,
  onRemove,
}: MarketCardProps) {
  const positive = (changePct ?? 0) >= 0;

  return (
    <Link
      href={href}
      className="card group relative flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${title} from watchlist`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 z-10 rounded-full p-1 text-ink-muted opacity-0 transition hover:bg-black/5 hover:text-loss group-hover:opacity-100 dark:hover:bg-white/10 dark:hover:text-loss-dark"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-primary dark:text-ink-primary-dark">{title}</p>
          <p className="truncate text-xs text-ink-muted">{subtitle}</p>
        </div>
        {changePct !== null && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              positive
                ? "bg-gain/10 text-gain dark:text-gain-dark"
                : "bg-loss/10 text-loss dark:text-loss-dark"
            }`}
          >
            {formatPercent(changePct)}
          </span>
        )}
      </div>

      <p className="text-2xl font-semibold tabular-nums text-ink-primary dark:text-ink-primary-dark">
        {priceLabel}
      </p>

      <SparklineChart points={sparkline} positive={positive} />

      {meta && <p className="text-xs text-ink-muted">{meta}</p>}

      {secondaryChanges.length > 0 && (
        <div className="flex gap-4 border-t border-black/5 pt-2 text-xs text-ink-secondary dark:border-white/5 dark:text-ink-secondary-dark">
          {secondaryChanges.map((change) => (
            <span key={change.label}>
              {change.label}:{" "}
              <span
                className={
                  change.pct === null
                    ? "text-ink-muted"
                    : change.pct >= 0
                      ? "text-gain dark:text-gain-dark"
                      : "text-loss dark:text-loss-dark"
                }
              >
                {change.pct === null ? "—" : formatPercent(change.pct)}
              </span>
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
