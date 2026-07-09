"use client";

import { ErrorState } from "@/components/ErrorState";
import { toUserMessage } from "@/services/api";
import { useJobRuns, useTriggerJobRun } from "@/hooks/useAdmin";
import { formatUpdatedAt } from "@/utils/format";

export default function AdminJobsPage() {
  const { data, isLoading, isError, error, refetch } = useJobRuns();
  const trigger = useTriggerJobRun();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scheduler Jobs</h1>
        <button
          type="button"
          disabled={trigger.isPending}
          onClick={() => trigger.mutate()}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-brand-dark"
        >
          {trigger.isPending ? "Running…" : "Run now"}
        </button>
      </div>

      {isLoading && <div className="skeleton h-64 w-full" />}
      {isError && <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />}

      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase text-ink-muted dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Stocks</th>
                <th className="px-4 py-3">Crypto</th>
                <th className="px-4 py-3">FX</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {data.items.map((run) => (
                <tr key={run.id}>
                  <td className="px-4 py-3">{formatUpdatedAt(run.started_at)}</td>
                  <td className="px-4 py-3 capitalize text-ink-muted">{run.triggered_by}</td>
                  <td className="px-4 py-3 tabular-nums">{run.stocks_stored}</td>
                  <td className="px-4 py-3 tabular-nums">{run.crypto_stored}</td>
                  <td className="px-4 py-3 tabular-nums">{run.fx_stored}</td>
                  <td className="px-4 py-3">
                    {run.success ? (
                      <span className="rounded-full bg-gain/10 px-2 py-0.5 text-xs font-medium text-gain dark:text-gain-dark">
                        Success
                      </span>
                    ) : (
                      <span
                        title={run.error_message ?? undefined}
                        className="rounded-full bg-loss/10 px-2 py-0.5 text-xs font-medium text-loss dark:text-loss-dark"
                      >
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                    No runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
