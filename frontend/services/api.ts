import axios from "axios";

import { supabase } from "@/services/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

// Attaches the current Supabase session's access token, if any, to every request.
// Public endpoints ignore the header; /admin/* endpoints require it.
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalizes Axios/network errors into a message safe to show in the UI. */
export function toUserMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const detail = error.response.data?.detail;
      if (typeof detail === "string") return detail;
      if (error.response.status === 401) return "Please sign in to continue.";
      if (error.response.status === 403) return "You don't have permission to do that.";
      if (error.response.status === 404) return "No data found.";
      if (error.response.status === 502) return "The upstream market data provider is unavailable right now.";
      return "Something went wrong fetching market data.";
    }
    return "Could not reach the market data API. Check your connection.";
  }
  return "An unexpected error occurred.";
}
