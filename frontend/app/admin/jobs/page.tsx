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
        <button type="button" disabled={trigger.isPending} onClick={() => trigger.mutate()} className="btn-primary">
          {trigger.isPending ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Running…
            </>
          ) : (
            "Run now"
          )}
        </button>
      </div>

      {isLoading && <div className="skeleton h-64 w-full" />}
      {isError && <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />}

      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-ink-muted dark:border-border-dark dark:text-ink-muted-dark">
              <tr>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Stocks</th>
                <th className="px-4 py-3">Crypto</th>
                <th className="px-4 py-3">FX</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {data.items.map((run) => (
                <tr key={run.id} className="transition duration-150 hover:bg-page dark:hover:bg-white/5">
                  <td className="px-4 py-3">{formatUpdatedAt(run.started_at)}</td>
                  <td className="px-4 py-3 capitalize text-ink-muted dark:text-ink-muted-dark">{run.triggered_by}</td>
                  <td className="px-4 py-3 tabular-nums">{run.stocks_stored}</td>
                  <td className="px-4 py-3 tabular-nums">{run.crypto_stored}</td>
                  <td className="px-4 py-3 tabular-nums">{run.fx_stored}</td>
                  <td className="px-4 py-3">
                    {run.success ? (
                      <span className="badge-gain">Success</span>
                    ) : (
                      <span title={run.error_message ?? undefined} className="badge-loss">
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-ink-muted dark:text-ink-muted-dark">
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
