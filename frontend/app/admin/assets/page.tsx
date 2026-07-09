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
            className="rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm dark:border-white/10 dark:bg-surface-dark"
          />
          <input
            required
            placeholder="Company name"
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
            className="rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm dark:border-white/10 dark:bg-surface-dark"
          />
          <button type="submit" disabled={addStock.isPending} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-brand-dark">
            Add
          </button>
        </form>
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {data.stocks.map((s) => (
            <li key={s.ticker} className="flex items-center justify-between py-2 text-sm">
              <span>{s.ticker} — {s.name}</span>
              <button type="button" onClick={() => removeStock.mutate(s.ticker)} className="text-loss hover:underline dark:text-loss-dark">
                Remove
              </button>
            </li>
          ))}
          {data.stocks.length === 0 && <li className="py-2 text-sm text-ink-muted">No stocks tracked yet.</li>}
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
            className="rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm dark:border-white/10 dark:bg-surface-dark"
          />
          <input
            required
            placeholder="Symbol (e.g. ADA)"
            value={cryptoSymbol}
            onChange={(e) => setCryptoSymbol(e.target.value)}
            className="rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm dark:border-white/10 dark:bg-surface-dark"
          />
          <input
            required
            placeholder="Name"
            value={cryptoName}
            onChange={(e) => setCryptoName(e.target.value)}
            className="rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm dark:border-white/10 dark:bg-surface-dark"
          />
          <button type="submit" disabled={addCrypto.isPending} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-brand-dark">
            Add
          </button>
        </form>
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {data.crypto.map((c) => (
            <li key={c.coingecko_id} className="flex items-center justify-between py-2 text-sm">
              <span>{c.symbol} — {c.name}</span>
              <button type="button" onClick={() => removeCrypto.mutate(c.coingecko_id)} className="text-loss hover:underline dark:text-loss-dark">
                Remove
              </button>
            </li>
          ))}
          {data.crypto.length === 0 && <li className="py-2 text-sm text-ink-muted">No coins tracked yet.</li>}
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
            className="rounded-md border border-black/10 bg-surface px-3 py-1.5 text-sm dark:border-white/10 dark:bg-surface-dark"
          />
          <button type="submit" disabled={addFx.isPending} className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-brand-dark">
            Add
          </button>
        </form>
        <ul className="divide-y divide-black/5 dark:divide-white/5">
          {data.fx.map((f) => (
            <li key={f.quote_currency} className="flex items-center justify-between py-2 text-sm">
              <span>AUD/{f.quote_currency}</span>
              <button type="button" onClick={() => removeFx.mutate(f.quote_currency)} className="text-loss hover:underline dark:text-loss-dark">
                Remove
              </button>
            </li>
          ))}
          {data.fx.length === 0 && <li className="py-2 text-sm text-ink-muted">No FX pairs tracked yet.</li>}
        </ul>
      </section>
    </div>
  );
}
