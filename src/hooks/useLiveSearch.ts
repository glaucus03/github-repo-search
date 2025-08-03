// リアルタイム検索結果数を取得するカスタムHook
import { useState, useEffect, useCallback } from "react";

import { useDebounce } from "./useDebounce";

interface LiveSearchResult {
  totalCount: number;
  loading: boolean;
  error: string | null;
}

export function useLiveSearch(query: string, delay = 300): LiveSearchResult {
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // デバウンス処理
  const debouncedQuery = useDebounce(query.trim(), delay);

  // 検索結果数を取得する関数
  const fetchSearchCount = useCallback(async (searchQuery: string) => {
    if (!searchQuery) {
      setTotalCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `/api/repositories/search?${new URLSearchParams({
        q: searchQuery,
        per_page: "1", // 結果数のみ必要なので最小限
      }).toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("検索に失敗しました");
      }

      const data = await response.json();
      setTotalCount(data.total_count || 0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "検索エラーが発生しました";
      setError(errorMessage);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // デバウンスされたクエリで検索実行
  useEffect(() => {
    fetchSearchCount(debouncedQuery);
  }, [debouncedQuery, fetchSearchCount]);

  return {
    totalCount,
    loading,
    error,
  };
}
