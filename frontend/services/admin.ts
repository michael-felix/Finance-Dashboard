import { apiClient } from "@/services/api";
import type { SchedulerRun, SchedulerRunListResponse, TrackedAssetsResponse } from "@/types/admin";
import type { UserListResponse, UserProfile } from "@/types/user";

export async function fetchMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/admin/me");
  return data;
}

export async function fetchTrackedAssets(): Promise<TrackedAssetsResponse> {
  const { data } = await apiClient.get<TrackedAssetsResponse>("/admin/assets");
  return data;
}

export async function addTrackedStock(ticker: string, name: string): Promise<void> {
  await apiClient.post("/admin/assets/stocks", { ticker, name });
}

export async function removeTrackedStock(ticker: string): Promise<void> {
  await apiClient.delete(`/admin/assets/stocks/${ticker}`);
}

export async function addTrackedCrypto(coingecko_id: string, symbol: string, name: string): Promise<void> {
  await apiClient.post("/admin/assets/crypto", { coingecko_id, symbol, name });
}

export async function removeTrackedCrypto(coingeckoId: string): Promise<void> {
  await apiClient.delete(`/admin/assets/crypto/${coingeckoId}`);
}

export async function addTrackedFx(quote_currency: string): Promise<void> {
  await apiClient.post("/admin/assets/fx", { quote_currency });
}

export async function removeTrackedFx(quoteCurrency: string): Promise<void> {
  await apiClient.delete(`/admin/assets/fx/${quoteCurrency}`);
}

export async function fetchUsers(): Promise<UserListResponse> {
  const { data } = await apiClient.get<UserListResponse>("/admin/users");
  return data;
}

export async function promoteUser(userId: number): Promise<UserProfile> {
  const { data } = await apiClient.post<UserProfile>(`/admin/users/${userId}/promote`);
  return data;
}

export async function demoteUser(userId: number): Promise<UserProfile> {
  const { data } = await apiClient.post<UserProfile>(`/admin/users/${userId}/demote`);
  return data;
}

export async function fetchJobRuns(): Promise<SchedulerRunListResponse> {
  const { data } = await apiClient.get<SchedulerRunListResponse>("/admin/jobs");
  return data;
}

export async function triggerJobRun(): Promise<SchedulerRun> {
  const { data } = await apiClient.post<SchedulerRun>("/admin/jobs/run-now");
  return data;
}
