import { act, renderHook } from "@testing-library/react";

import type { GitHubRepository } from "@/types/github";

import { useUIStore } from "../uiStore";

// Mock storage
jest.mock("@/lib/storage", () => ({
  FavoritesStorage: {
    getFavorites: jest.fn(() => []),
    addToFavorites: jest.fn(() => true),
    removeFromFavorites: jest.fn(() => true),
    clearFavorites: jest.fn(),
  },
}));

describe("uiStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      theme: "system",
      isSearchFormExpanded: false,
      selectedSortOption: "best-match",
      selectedOrderOption: "desc",
      showRepositoryModal: false,
      selectedRepositoryId: null,
      sidebarOpen: false,
      viewMode: "grid",
      autoLoadMore: true,
      notifications: [],
      favorites: [],
      favoriteCount: 0,
    });
  });

  it("初期状態が正しく設定される", () => {
    const { result } = renderHook(() => useUIStore());

    expect(result.current.theme).toBe("system");
    expect(result.current.isSearchFormExpanded).toBe(false);
    expect(result.current.selectedSortOption).toBe("best-match");
    expect(result.current.selectedOrderOption).toBe("desc");
    expect(result.current.viewMode).toBe("grid");
    expect(result.current.notifications).toEqual([]);
  });

  it("テーマの設定が正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
  });

  it("テーマの切り替えが正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setTheme("light");
    });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("dark");
  });

  it("検索フォームの展開/折りたたみが正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleSearchForm();
    });

    expect(result.current.isSearchFormExpanded).toBe(true);

    act(() => {
      result.current.collapseSearchForm();
    });

    expect(result.current.isSearchFormExpanded).toBe(false);
  });

  it("ソートオプションの設定が正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.setSortOption("stars");
    });

    expect(result.current.selectedSortOption).toBe("stars");
  });

  it("順序オプションの切り替えが正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleOrder();
    });

    expect(result.current.selectedOrderOption).toBe("asc");

    act(() => {
      result.current.toggleOrder();
    });

    expect(result.current.selectedOrderOption).toBe("desc");
  });

  it("モーダルの開閉が正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.openRepositoryModal("repo-123");
    });

    expect(result.current.showRepositoryModal).toBe(true);
    expect(result.current.selectedRepositoryId).toBe("repo-123");

    act(() => {
      result.current.closeRepositoryModal();
    });

    expect(result.current.showRepositoryModal).toBe(false);
    expect(result.current.selectedRepositoryId).toBe(null);
  });

  it("表示モードの切り替えが正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.toggleViewMode();
    });

    expect(result.current.viewMode).toBe("list");

    act(() => {
      result.current.setViewMode("grid");
    });

    expect(result.current.viewMode).toBe("grid");
  });

  it("通知の追加と削除が正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    const notification = {
      type: "success" as const,
      message: "テスト通知",
    };

    act(() => {
      result.current.addNotification(notification);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe("テスト通知");

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it("通知の全クリアが正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    act(() => {
      result.current.addNotification({ type: "info", message: "通知1" });
      result.current.addNotification({ type: "warning", message: "通知2" });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearAllNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it("お気に入りの追加と削除が正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    const mockRepository = {
      id: 123,
      name: "test-repo",
      full_name: "user/test-repo",
      owner: { login: "user", id: 1, avatar_url: "avatar.png" },
    } as unknown as GitHubRepository;

    act(() => {
      result.current.addToFavorites(mockRepository);
    });

    expect(result.current.favoriteCount).toBe(1);
    expect(result.current.isFavorite(123)).toBe(true);

    act(() => {
      result.current.removeFromFavorites(123);
    });

    expect(result.current.favoriteCount).toBe(0);
    expect(result.current.isFavorite(123)).toBe(false);
  });

  it("初期状態へのリセットが正しく動作する", () => {
    const { result } = renderHook(() => useUIStore());

    // 状態を変更
    act(() => {
      result.current.setTheme("dark");
      result.current.toggleSearchForm();
      result.current.openRepositoryModal("test");
      result.current.addNotification({ type: "info", message: "test" });
    });

    // リセット実行
    act(() => {
      result.current.resetToInitialState();
    });

    expect(result.current.theme).toBe("system");
    expect(result.current.isSearchFormExpanded).toBe(false);
    expect(result.current.showRepositoryModal).toBe(false);
    expect(result.current.selectedRepositoryId).toBe(null);
    expect(result.current.notifications).toEqual([]);
  });
});
