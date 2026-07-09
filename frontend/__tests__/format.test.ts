import { formatCompactCurrency, formatCurrency, formatPercent, formatRate } from "@/utils/format";

describe("formatCurrency", () => {
  it("formats a positive AUD amount with two decimal places", () => {
    expect(formatCurrency(168.18)).toBe("$168.18");
  });

  it("does not throw when maximumFractionDigits is 0 (regression: min > max RangeError)", () => {
    // Detail pages call formatCurrency(value, currency, 0) for chart axis labels;
    // Intl.NumberFormat throws if minimumFractionDigits (default 2) exceeds maximumFractionDigits.
    expect(() => formatCurrency(90000, "AUD", 0)).not.toThrow();
    expect(formatCurrency(90000, "AUD", 0)).toBe("$90,000");
  });

  it("formats other currencies", () => {
    expect(formatCurrency(1.5, "USD")).toContain("1.50");
  });
});

describe("formatCompactCurrency", () => {
  it("compacts large numbers", () => {
    expect(formatCompactCurrency(1_800_000_000_000)).toMatch(/\$1\.8\d?T/);
  });
});

describe("formatPercent", () => {
  it("prefixes positive values with a plus sign", () => {
    expect(formatPercent(1.2345)).toBe("+1.23%");
  });

  it("does not prefix negative values", () => {
    expect(formatPercent(-2.5)).toBe("-2.50%");
  });

  it("does not prefix zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });
});

describe("formatRate", () => {
  it("defaults to 4 decimal places", () => {
    expect(formatRate(0.6543219)).toBe("0.6543");
  });
});
