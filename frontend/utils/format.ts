export function formatCurrency(value: number, currency = "AUD", maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits: Math.min(2, maximumFractionDigits),
  }).format(value);
}

export function formatCompactCurrency(value: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(fractionDigits)}%`;
}

export function formatRate(value: number, fractionDigits = 4): string {
  return value.toFixed(fractionDigits);
}

export function formatUpdatedAt(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(isoTimestamp));
}
