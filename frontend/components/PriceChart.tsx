"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartRange, PricePoint } from "@/types/market";

const RANGES: ChartRange[] = ["1D", "1W", "1M", "3M"];

interface PriceChartProps {
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  points: PricePoint[];
  isLoading: boolean;
  isError: boolean;
  valueFormatter: (value: number) => string;
  positive: boolean;
}

function formatTimestampTick(timestamp: string, range: ChartRange): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  if (range === "1D") {
    return new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short" }).format(date);
}

function ChartTooltip({
  active,
  payload,
  range,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { value: number; payload: PricePoint }[];
  range: ChartRange;
  valueFormatter: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  if (!point) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-md">
      <p className="text-ink-muted">{formatTimestampTick(point.payload.timestamp, range)}</p>
      <p className="font-semibold tabular-nums text-ink-primary dark:text-ink-primary-dark">
        {valueFormatter(point.value)}
      </p>
    </div>
  );
}

/** Historical price chart with 1D/1W/1M/3M range switching. Used on every asset detail page. */
export function PriceChart({
  range,
  onRangeChange,
  points,
  isLoading,
  isError,
  valueFormatter,
  positive,
}: PriceChartProps) {
  const stroke = positive ? "#006300" : "#e34948";

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center gap-1" role="group" aria-label="Chart range">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
              r === range
                ? "bg-brand text-white dark:bg-brand-dark"
                : "text-ink-secondary hover:bg-black/5 dark:text-ink-secondary-dark dark:hover:bg-white/5"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="h-72 w-full">
        {isLoading && <div className="skeleton h-full w-full" />}
        {isError && !isLoading && (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            Historical data unavailable for this range.
          </div>
        )}
        {!isLoading && !isError && points.length < 2 && (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            Not enough data yet for this range.
          </div>
        )}
        {!isLoading && !isError && points.length >= 2 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v: string) => formatTimestampTick(v, range)}
                stroke="#898781"
                tick={{ fontSize: 11 }}
                minTickGap={70}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#898781"
                tick={{ fontSize: 11 }}
                width={64}
                tickFormatter={(v: number) => valueFormatter(v)}
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltip
                    active={props.active}
                    payload={props.payload as { value: number; payload: PricePoint }[]}
                    range={range}
                    valueFormatter={valueFormatter}
                  />
                )}
                cursor={{ stroke: "#898781", strokeWidth: 1, strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#price-fill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
