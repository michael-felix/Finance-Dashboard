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
          <thead className="border-b border-black/10 text-xs uppercase text-ink-muted dark:border-white/10">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {data.items.map((u) => {
              const isSelf = u.supabase_user_id === currentUser?.id;
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatUpdatedAt(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_admin ? "bg-brand/10 text-brand dark:text-brand-dark" : "bg-black/5 text-ink-muted dark:bg-white/10"
                      }`}
                    >
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
                        className="text-loss hover:underline disabled:cursor-not-allowed disabled:opacity-40 dark:text-loss-dark"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={promote.isPending}
                        onClick={() => promote.mutate(u.id)}
                        className="text-brand hover:underline dark:text-brand-dark"
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
