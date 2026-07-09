"use client";

import { useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { toUserMessage } from "@/services/api";
import { useAssetMutations, useTrackedAssets } from "@/hooks/useAdmin";

export default function AdminAssetsPage() {
  const { data, isLoading, isError, error, refetch } = useTrackedAssets();
  const { addStock, removeStock, addCrypto, removeCrypto, addFx, removeFx } = useAssetMutations();

  const [stockTicker, setStockTicker] = useState("");
  const [stockName, setStockName] = useState("");
  const [cryptoId, setCryptoId] = useState("");
  const [cryptoSymbol, setCryptoSymbol] = useState("");
  const [cryptoName, setCryptoName] = useState("");
  const [fxCurrency, setFxCurrency] = useState("");

  if (isLoading) return <div className="skeleton h-64 w-full" />;
  if (isError || !data) return <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Tracked Assets</h1>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Stocks</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addStock.mutate(
              { ticker: stockTicker, name: stockName },
              { onSuccess: () => { setStockTicker(""); setStockName(""); } },
            );
          }}
          className="mb-4 flex flex-wrap gap-2"
        >
          <input
            required
            placeholder="Ticker (e.g. WOW.AX)"
            value={stockTicker}
            onChange={(e) => setStockTicker(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink-primary outline-none transition duration-150 focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-border-dark dark:bg-surface-dark dark:text-ink-primary-dark"
          />
          <input
            required
            placeholder="Company name"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink-primary outline-none transition duration-150 focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-border-dark dark:bg-surface-dark dark:text-ink-primary-dark"
          />
          <button type="submit" disabled={addStock.isPending} className="btn-primary">
            Add
          </button>
        </form>
        <ul className="divide-y divide-border dark:divide-border-dark">
          {data.stocks.map((s) => (
            <li key={s.ticker} className="flex items-center justify-between py-2 text-sm">
              <span>{s.ticker} — {s.name}</span>
              <button type="button" onClick={() => removeStock.mutate(s.ticker)} className="btn-danger-ghost px-2 py-1 text-xs">
                Remove
              </button>
            </li>
          ))}
          {data.stocks.length === 0 && <li className="py-2 text-sm text-ink-muted dark:text-ink-muted-dark">No stocks tracked yet.</li>}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Cryptocurrency</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCrypto.mutate(
              { id: cryptoId, symbol: cryptoSymbol, name: cryptoName },
              { onSuccess: () => { setCryptoId(""); setCryptoSymbol(""); setCryptoName(""); } },
            );
          }}
          className="mb-4 flex flex-wrap gap-2"
        >
          <input
            required
            placeholder="CoinGecko id (e.g. cardano)"
            value={cryptoId}
            onChange={(e) => setCryptoId(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink-primary outline-none transition duration-150 focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-border-dark dark:bg-surface-dark dark:text-ink-primary-dark"
          />
          <input
            required
            placeholder="Symbol (e.g. ADA)"
            value={cryptoSymbol}
            onChange={(e) => setCryptoSymbol(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink-primary outline-none transition duration-150 focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-border-dark dark:bg-surface-dark dark:text-ink-primary-dark"
          />
          <input
            required
            placeholder="Name"
            value={cryptoName}
            onChange={(e) => setCryptoName(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink-primary outline-none transition duration-150 focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-border-dark dark:bg-surface-dark dark:text-ink-primary-dark"
          />
          <button type="submit" disabled={addCrypto.isPending} className="btn-primary">
            Add
          </button>
        </form>
        <ul className="divide-y divide-border dark:divide-border-dark">
          {data.crypto.map((c) => (
            <li key={c.coingecko_id} className="flex items-center justify-between py-2 text-sm">
              <span>{c.symbol} — {c.name}</span>
              <button type="button" onClick={() => removeCrypto.mutate(c.coingecko_id)} className="btn-danger-ghost px-2 py-1 text-xs">
                Remove
              </button>
            </li>
          ))}
          {data.crypto.length === 0 && <li className="py-2 text-sm text-ink-muted dark:text-ink-muted-dark">No coins tracked yet.</li>}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">FX Pairs (AUD base)</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addFx.mutate(fxCurrency, { onSuccess: () => setFxCurrency("") });
          }}
          className="mb-4 flex flex-wrap gap-2"
        >
          <input
            required
            placeholder="Currency code (e.g. CAD)"
            value={fxCurrency}
            onChange={(e) => setFxCurrency(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-ink-primary outline-none transition duration-150 focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-border-dark dark:bg-surface-dark dark:text-ink-primary-dark"
          />
          <button type="submit" disabled={addFx.isPending} className="btn-primary">
            Add
          </button>
        </form>
        <ul className="divide-y divide-border dark:divide-border-dark">
          {data.fx.map((f) => (
            <li key={f.quote_currency} className="flex items-center justify-between py-2 text-sm">
              <span>AUD/{f.quote_currency}</span>
              <button type="button" onClick={() => removeFx.mutate(f.quote_currency)} className="btn-danger-ghost px-2 py-1 text-xs">
                Remove
              </button>
            </li>
          ))}
          {data.fx.length === 0 && <li className="py-2 text-sm text-ink-muted dark:text-ink-muted-dark">No FX pairs tracked yet.</li>}
        </ul>
      </section>
    </div>
  );
}
