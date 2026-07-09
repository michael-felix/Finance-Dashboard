"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

import type { PricePoint } from "@/types/market";

interface SparklineChartProps {
  points: PricePoint[];
  positive: boolean;
  height?: number;
}

/** A minimal trend line for market cards. No axes/gridlines — the full PriceChart carries those. */
export function SparklineChart({ points, positive, height = 48 }: SparklineChartProps) {
  if (points.length < 2) {
    return <div style={{ height }} className="flex items-center text-xs text-ink-muted">Not enough data</div>;
  }

  const stroke = positive ? "var(--color-gain)" : "var(--color-loss)";

  return (
    <div style={{ height }} className="[--color-gain:#006300] [--color-loss:#e34948] dark:[--color-gain:#0ca30c] dark:[--color-loss:#e66767]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            strokeLinecap="round"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
