import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addTrackedCrypto,
  addTrackedFx,
  addTrackedStock,
  demoteUser,
  fetchJobRuns,
  fetchMe,
  fetchTrackedAssets,
  fetchUsers,
  promoteUser,
  removeTrackedCrypto,
  removeTrackedFx,
  removeTrackedStock,
  triggerJobRun,
} from "@/services/admin";
import { useAuth } from "@/context/AuthContext";

/** The current user's profile (including is_admin), only fetched once signed in. */
export function useMe() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-me"],
    queryFn: fetchMe,
    enabled: Boolean(user),
    retry: false,
  });
}

export function useTrackedAssets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-assets"],
    queryFn: fetchTrackedAssets,
    enabled: Boolean(user),
  });
}

export function useAssetMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-assets"] });

  return {
    addStock: useMutation({
      mutationFn: ({ ticker, name }: { ticker: string; name: string }) => addTrackedStock(ticker, name),
      onSuccess: invalidate,
    }),
    removeStock: useMutation({
      mutationFn: (ticker: string) => removeTrackedStock(ticker),
      onSuccess: invalidate,
    }),
    addCrypto: useMutation({
      mutationFn: ({ id, symbol, name }: { id: string; symbol: string; name: string }) =>
        addTrackedCrypto(id, symbol, name),
      onSuccess: invalidate,
    }),
    removeCrypto: useMutation({
      mutationFn: (id: string) => removeTrackedCrypto(id),
      onSuccess: invalidate,
    }),
    addFx: useMutation({
      mutationFn: (currency: string) => addTrackedFx(currency),
      onSuccess: invalidate,
    }),
    removeFx: useMutation({
      mutationFn: (currency: string) => removeTrackedFx(currency),
      onSuccess: invalidate,
    }),
  };
}

export function useUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
    enabled: Boolean(user),
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  return {
    promote: useMutation({ mutationFn: promoteUser, onSuccess: invalidate }),
    demote: useMutation({ mutationFn: demoteUser, onSuccess: invalidate }),
  };
}

export function useJobRuns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-jobs"],
    queryFn: fetchJobRuns,
    enabled: Boolean(user),
  });
}

export function useTriggerJobRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerJobRun,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-jobs"] }),
  });
}
