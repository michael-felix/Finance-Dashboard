import { useQuery } from "@tanstack/react-query";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchAssets } from "@/services/search";

const DEBOUNCE_MS = 300;

export function useSearch(rawQuery: string) {
  const query = useDebouncedValue(rawQuery.trim(), DEBOUNCE_MS);

  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchAssets(query),
    enabled: query.length > 0,
    staleTime: 60_000,
  });
}
