"use client";

import { ErrorState } from "@/components/ErrorState";
import { useAuth } from "@/context/AuthContext";
import { toUserMessage } from "@/services/api";
import { useUserMutations, useUsers } from "@/hooks/useAdmin";
import { formatUpdatedAt } from "@/utils/format";

export default function AdminUsersPage() {
  const { data, isLoading, isError, error, refetch } = useUsers();
  const { promote, demote } = useUserMutations();
  const { user: currentUser } = useAuth();

  if (isLoading) return <div className="skeleton h-64 w-full" />;
  if (isError || !data) return <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Users</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-ink-muted dark:border-border-dark dark:text-ink-muted-dark">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border-dark">
            {data.items.map((u) => {
              const isSelf = u.supabase_user_id === currentUser?.id;
              return (
                <tr key={u.id} className="transition duration-150 hover:bg-page dark:hover:bg-white/5">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 text-ink-muted dark:text-ink-muted-dark">{formatUpdatedAt(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={u.is_admin ? "badge-neutral" : "badge bg-page text-ink-muted dark:bg-white/5 dark:text-ink-muted-dark"}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.is_admin ? (
                      <button
                        type="button"
                        disabled={isSelf || demote.isPending}
                        onClick={() => demote.mutate(u.id)}
                        title={isSelf ? "You cannot demote yourself" : undefined}
                        className="btn-danger-ghost px-2 py-1 text-xs disabled:hover:bg-transparent"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={promote.isPending}
                        onClick={() => promote.mutate(u.id)}
                        className="btn text-xs text-brand hover:bg-brand/10 dark:text-brand-dark dark:hover:bg-brand-dark/10"
                      >
                        Promote
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
