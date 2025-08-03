import { act, renderHook } from "@testing-library/react";

import type { GitHubRepository } from "@/types/github";

import { useSearchStore } from "../searchStore";

// Mock storage
jest.mock("@/lib/storage", () => ({
  SearchHistoryStorage: {
    getHistory: jest.fn(() => []),
    addToHistory: jest.fn(),
    removeFromHistory: jest.fn(),
    clearHistory: jest.fn(),
  },
}));

// Mock search domain functions
jest.mock("@/lib/search-domain", () => ({
  validateSearchQuery: jest.fn(() => ({ isValid: true, errors: [] })),
  calculateRepositoryQuality: jest.fn(() => 0.8),
  calculateSearchStatistics: jest.fn(() => ({
    totalCount: 0,
    averageStars: 0,
    averageForks: 0,
    languageDistribution: new Map(),
    qualityDistribution: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    },
  })),
}));

describe("searchStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useSearchStore.setState({
      query: "",
      results: [],
      loading: false,
      error: null,
      hasMore: true,
      page: 1,
      totalCount: 0,
      searchOptions: {
        sort: "best-match",
        order: "desc",
      },
      searchHistory: [],
      queryValidation: {
        isValid: true,
        errors: [],
      },
    });
  });

  it("初期状態が正しく設定される", () => {
    const { result } = renderHook(() => useSearchStore());

    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.page).toBe(1);
    expect(result.current.totalCount).toBe(0);
  });

  it("クエリの設定が正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());

    act(() => {
      result.current.setQuery("react");
    });

    expect(result.current.query).toBe("react");
  });

  it("結果の設定が正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());
    const mockResults = [
      { id: 1, name: "test-repo", stargazers_count: 100 },
    ] as unknown as GitHubRepository[];

    act(() => {
      result.current.setResults(mockResults);
    });

    expect(result.current.results).toEqual(mockResults);
  });

  it("結果の追加が正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());
    const initialResults = [
      { id: 1, name: "repo1" },
    ] as unknown as GitHubRepository[];
    const additionalResults = [
      { id: 2, name: "repo2" },
    ] as unknown as GitHubRepository[];

    act(() => {
      result.current.setResults(initialResults);
    });

    act(() => {
      result.current.addResults(additionalResults);
    });

    expect(result.current.results).toHaveLength(2);
    expect(result.current.results).toEqual([
      ...(initialResults as GitHubRepository[]),
      ...(additionalResults as GitHubRepository[]),
    ]);
  });

  it("ローディング状態の管理が正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it("エラー状態の管理が正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());

    act(() => {
      result.current.setError("Test error");
    });

    expect(result.current.error).toBe("Test error");

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBe(null);
  });

  it("ページ管理が正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.page).toBe(2);

    act(() => {
      result.current.incrementPage();
    });

    expect(result.current.page).toBe(3);
  });

  it("検索オプションの設定が正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());

    act(() => {
      result.current.setSearchOptions({
        sort: "stars",
        language: "javascript",
        minStars: 100,
      });
    });

    expect(result.current.searchOptions.sort).toBe("stars");
    expect(result.current.searchOptions.language).toBe("javascript");
    expect(result.current.searchOptions.minStars).toBe(100);
  });

  it("検索リセットが正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());

    // 状態を変更
    act(() => {
      result.current.setQuery("react");
      result.current.setResults([
        { id: 1, name: "test" },
      ] as unknown as GitHubRepository[]);
      result.current.setLoading(true);
      result.current.setError("error");
      result.current.setPage(2);
    });

    // リセット実行
    act(() => {
      result.current.resetResults();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.page).toBe(1);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.error).toBe(null);
  });

  it("クエリバリデーションが正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());

    act(() => {
      const isValid = result.current.validateQuery("react");
      expect(isValid).toBe(true);
    });
  });

  it("リポジトリ品質計算が正しく動作する", () => {
    const { result } = renderHook(() => useSearchStore());
    const mockRepo = { stargazers_count: 100 } as unknown as GitHubRepository;

    const quality = result.current.getRepositoryQuality(mockRepo);
    expect(quality).toBe(0.8);
  });
});
