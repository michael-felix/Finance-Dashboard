import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MarketCard } from "@/components/MarketCard";

const sparkline = [
  { timestamp: "1", value: 100 },
  { timestamp: "2", value: 101 },
  { timestamp: "3", value: 102 },
];

describe("MarketCard", () => {
  it("renders title, subtitle, price, and change badge", () => {
    render(
      <MarketCard
        href="/stocks/CBA.AX"
        title="CBA.AX"
        subtitle="Commonwealth Bank of Australia"
        priceLabel="$168.18"
        changePct={0.89}
        sparkline={sparkline}
      />,
    );

    expect(screen.getByText("CBA.AX")).toBeInTheDocument();
    expect(screen.getByText("Commonwealth Bank of Australia")).toBeInTheDocument();
    expect(screen.getByText("$168.18")).toBeInTheDocument();
    expect(screen.getByText("+0.89%")).toBeInTheDocument();
  });

  it("links to the given href", () => {
    render(
      <MarketCard
        href="/stocks/CBA.AX"
        title="CBA.AX"
        subtitle="Commonwealth Bank"
        priceLabel="$168.18"
        changePct={0.89}
        sparkline={sparkline}
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/stocks/CBA.AX");
  });

  it("omits the change badge when changePct is null", () => {
    render(
      <MarketCard
        href="/fx/USD"
        title="AUD/USD"
        subtitle="1 AUD = 0.65 USD"
        priceLabel="0.6500"
        changePct={null}
        sparkline={[]}
      />,
    );

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("calls onRemove without navigating when the remove button is clicked", async () => {
    const onRemove = jest.fn();
    const user = userEvent.setup();

    render(
      <MarketCard
        href="/stocks/CBA.AX"
        title="CBA.AX"
        subtitle="Commonwealth Bank"
        priceLabel="$168.18"
        changePct={0.89}
        sparkline={sparkline}
        onRemove={onRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: /remove/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
