export type AssetType = "stock" | "crypto" | "fx";

export interface SearchResult {
  type: AssetType;
  symbol: string;
  name: string;
  subtitle: string | null;
}

export interface SearchResponse {
  items: SearchResult[];
}
