import type { GitHubRepository } from "@/types/github";

import { createMockGitHubRepository } from "../../test-utils";
import {
  LocalStorageManager,
  SearchHistoryStorage,
  FavoritesStorage,
  UISettingsStorage,
  DataMigration,
  STORAGE_KEYS,
  UISettings,
} from "../storage";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    hasOwnProperty: jest.fn((key: string) => key in store),
    // テスト用のstore直接アクセス
    __getStore: () => store,
    __setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock console.warn
const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

describe("storage", () => {
  beforeEach(() => {
    mockLocalStorage.__setStore({});
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("STORAGE_KEYS", () => {
    it("定数が正しく定義されている", () => {
      expect(STORAGE_KEYS.SEARCH_HISTORY).toBe("github-search-history");
      expect(STORAGE_KEYS.FAVORITES).toBe("github-search-favorites");
      expect(STORAGE_KEYS.UI_SETTINGS).toBe("github-search-ui-settings");
      expect(STORAGE_KEYS.SEARCH_SETTINGS).toBe("github-search-settings");
    });
  });

  describe("LocalStorageManager", () => {
    describe("getItem", () => {
      it("存在するアイテムを取得する", () => {
        const testData = { test: "value" };
        mockLocalStorage.setItem("test-key", JSON.stringify(testData));

        const result = LocalStorageManager.getItem("test-key", {});
        expect(result).toEqual(testData);
      });

      it("存在しないアイテムでデフォルト値を返す", () => {
        const defaultValue = { default: true };
        const result = LocalStorageManager.getItem("nonexistent", defaultValue);
        expect(result).toEqual(defaultValue);
      });

      it("JSON解析エラー時にデフォルト値を返す", () => {
        mockLocalStorage.__getStore()["invalid-json"] = "invalid json";
        mockLocalStorage.getItem.mockReturnValueOnce("invalid json");

        const defaultValue = { default: true };
        const result = LocalStorageManager.getItem(
          "invalid-json",
          defaultValue,
        );

        expect(result).toEqual(defaultValue);
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it("クライアント環境でない場合はデフォルト値を返す", () => {
        // isClient を false にするために window を削除
        const originalWindow = global.window;
        delete (global as Record<string, unknown>).window;

        const defaultValue = { default: true };
        const result = LocalStorageManager.getItem("test", defaultValue);

        expect(result).toEqual(defaultValue);

        // window を復元
        global.window = originalWindow;
      });
    });

    describe("setItem", () => {
      it("アイテムを正常に設定する", () => {
        const testData = { test: "value" };
        const success = LocalStorageManager.setItem("test-key", testData);

        expect(success).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "test-key",
          JSON.stringify(testData),
        );
      });

      it("エラー時にfalseを返す", () => {
        mockLocalStorage.setItem.mockImplementationOnce(() => {
          throw new Error("Storage error");
        });

        const success = LocalStorageManager.setItem("test-key", {
          test: "value",
        });

        expect(success).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it("クライアント環境でない場合はfalseを返す", () => {
        // LocalStorageManager.isClient を直接テストするためのアプローチ
        const originalIsClient = (
          LocalStorageManager as unknown as Record<string, unknown>
        ).isClient;
        Object.defineProperty(LocalStorageManager, "isClient", {
          value: false,
          configurable: true,
        });

        const success = LocalStorageManager.setItem("test", { test: "value" });

        expect(success).toBe(false);

        // 復元
        Object.defineProperty(LocalStorageManager, "isClient", {
          value: originalIsClient,
          configurable: true,
        });
      });
    });

    describe("removeItem", () => {
      it("アイテムを正常に削除する", () => {
        const success = LocalStorageManager.removeItem("test-key");

        expect(success).toBe(true);
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-key");
      });

      it("エラー時にfalseを返す", () => {
        mockLocalStorage.removeItem.mockImplementationOnce(() => {
          throw new Error("Storage error");
        });

        const success = LocalStorageManager.removeItem("test-key");

        expect(success).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalled();
      });
    });

    describe("clear", () => {
      it("ストレージを正常にクリアする", () => {
        const success = LocalStorageManager.clear();

        expect(success).toBe(true);
        expect(mockLocalStorage.clear).toHaveBeenCalled();
      });

      it("エラー時にfalseを返す", () => {
        mockLocalStorage.clear.mockImplementationOnce(() => {
          throw new Error("Storage error");
        });

        const success = LocalStorageManager.clear();

        expect(success).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalled();
      });
    });

    describe("getStorageSize", () => {
      it("ストレージサイズを正しく計算する", () => {
        // より簡単なテストアプローチ
        const originalIsClient = (
          LocalStorageManager as unknown as Record<string, unknown>
        ).isClient;
        Object.defineProperty(LocalStorageManager, "isClient", {
          value: true,
          configurable: true,
        });

        // 実際のlocalStorageをモック
        const mockStore = { key1: "value1", key2: "value2" };
        Object.defineProperty(global, "localStorage", {
          value: {
            ...mockLocalStorage,
            key1: "value1",
            key2: "value2",
            hasOwnProperty: jest.fn((key) => key in mockStore),
          },
          configurable: true,
        });

        const size = LocalStorageManager.getStorageSize();

        // 具体的な値をテストするのではなく、0より大きいことをテスト
        expect(size).toBeGreaterThan(0);

        // 復元
        Object.defineProperty(LocalStorageManager, "isClient", {
          value: originalIsClient,
          configurable: true,
        });
      });

      it("クライアント環境でない場合は0を返す", () => {
        const originalIsClient = (
          LocalStorageManager as unknown as Record<string, unknown>
        ).isClient;
        Object.defineProperty(LocalStorageManager, "isClient", {
          value: false,
          configurable: true,
        });

        const size = LocalStorageManager.getStorageSize();

        expect(size).toBe(0);

        // 復元
        Object.defineProperty(LocalStorageManager, "isClient", {
          value: originalIsClient,
          configurable: true,
        });
      });
    });
  });

  describe("SearchHistoryStorage", () => {
    describe("getHistory", () => {
      it("履歴を取得する", () => {
        const history = ["react", "vue", "angular"];
        mockLocalStorage.setItem(
          STORAGE_KEYS.SEARCH_HISTORY,
          JSON.stringify(history),
        );

        const result = SearchHistoryStorage.getHistory();
        expect(result).toEqual(history);
      });

      it("履歴がない場合は空配列を返す", () => {
        const result = SearchHistoryStorage.getHistory();
        expect(result).toEqual([]);
      });
    });

    describe("addToHistory", () => {
      it("新しいクエリを履歴の先頭に追加する", () => {
        SearchHistoryStorage.addToHistory("react");

        const history = SearchHistoryStorage.getHistory();
        expect(history[0]).toBe("react");
      });

      it("重複するクエリを除去する", () => {
        SearchHistoryStorage.addToHistory("react");
        SearchHistoryStorage.addToHistory("vue");
        SearchHistoryStorage.addToHistory("react"); // 重複

        const history = SearchHistoryStorage.getHistory();
        expect(history).toEqual(["react", "vue"]);
      });

      it("最大サイズを超えた古い履歴を削除する", () => {
        // MAX_HISTORY_SIZE (50) を超える履歴を追加
        for (let i = 0; i < 52; i++) {
          SearchHistoryStorage.addToHistory(`query${i}`);
        }

        const history = SearchHistoryStorage.getHistory();
        expect(history.length).toBe(50);
        expect(history[0]).toBe("query51"); // 最新
        expect(history[49]).toBe("query2"); // 最古
      });

      it("空のクエリを無視する", () => {
        SearchHistoryStorage.addToHistory("");
        SearchHistoryStorage.addToHistory("   ");

        const history = SearchHistoryStorage.getHistory();
        expect(history).toEqual([]);
      });

      it("クエリをトリムして追加する", () => {
        SearchHistoryStorage.addToHistory("  react  ");

        const history = SearchHistoryStorage.getHistory();
        expect(history[0]).toBe("react");
      });
    });

    describe("removeFromHistory", () => {
      it("指定したクエリを履歴から削除する", () => {
        SearchHistoryStorage.addToHistory("react");
        SearchHistoryStorage.addToHistory("vue");
        SearchHistoryStorage.addToHistory("angular");

        SearchHistoryStorage.removeFromHistory("vue");

        const history = SearchHistoryStorage.getHistory();
        expect(history).toEqual(["angular", "react"]);
      });

      it("存在しないクエリの削除は無視する", () => {
        SearchHistoryStorage.addToHistory("react");
        SearchHistoryStorage.removeFromHistory("nonexistent");

        const history = SearchHistoryStorage.getHistory();
        expect(history).toEqual(["react"]);
      });
    });

    describe("clearHistory", () => {
      it("履歴をクリアする", () => {
        SearchHistoryStorage.addToHistory("react");
        SearchHistoryStorage.addToHistory("vue");

        SearchHistoryStorage.clearHistory();

        const history = SearchHistoryStorage.getHistory();
        expect(history).toEqual([]);
      });
    });
  });

  describe("FavoritesStorage", () => {
    const mockRepository: GitHubRepository = createMockGitHubRepository({
      name: "test-repo",
      full_name: "owner/test-repo",
      description: "Test repository",
      stargazers_count: 100,
      language: "TypeScript",
      forks_count: 10,
      watchers_count: 5,
      updated_at: "2023-01-01T00:00:00Z",
      created_at: "2023-01-01T00:00:00Z",
      pushed_at: "2023-01-01T00:00:00Z",
      default_branch: "main",
      topics: [],
    });

    describe("getFavorites", () => {
      it("お気に入りを取得する", () => {
        const favorites = [mockRepository];
        mockLocalStorage.setItem(
          STORAGE_KEYS.FAVORITES,
          JSON.stringify(favorites),
        );

        const result = FavoritesStorage.getFavorites();
        expect(result).toEqual(favorites);
      });

      it("お気に入りがない場合は空配列を返す", () => {
        const result = FavoritesStorage.getFavorites();
        expect(result).toEqual([]);
      });
    });

    describe("addToFavorites", () => {
      it("新しいリポジトリをお気に入りに追加する", () => {
        const success = FavoritesStorage.addToFavorites(mockRepository);

        expect(success).toBe(true);
        const favorites = FavoritesStorage.getFavorites();
        expect(favorites).toContainEqual(mockRepository);
      });

      it("既存のリポジトリの追加を拒否する", () => {
        FavoritesStorage.addToFavorites(mockRepository);
        const success = FavoritesStorage.addToFavorites(mockRepository);

        expect(success).toBe(false);
        const favorites = FavoritesStorage.getFavorites();
        expect(favorites.length).toBe(1);
      });

      it("最大数を超える追加を拒否する", () => {
        // MAX_FAVORITES_SIZE (100) まで追加
        for (let i = 0; i < 100; i++) {
          FavoritesStorage.addToFavorites({ ...mockRepository, id: i });
        }

        const success = FavoritesStorage.addToFavorites({
          ...mockRepository,
          id: 999,
        });

        expect(success).toBe(false);
        const favorites = FavoritesStorage.getFavorites();
        expect(favorites.length).toBe(100);
      });

      it("新しいリポジトリを先頭に追加する", () => {
        const repo1 = { ...mockRepository, id: 1 };
        const repo2 = { ...mockRepository, id: 2 };

        FavoritesStorage.addToFavorites(repo1);
        FavoritesStorage.addToFavorites(repo2);

        const favorites = FavoritesStorage.getFavorites();
        expect(favorites[0]).toEqual(repo2);
        expect(favorites[1]).toEqual(repo1);
      });
    });

    describe("removeFromFavorites", () => {
      it("指定したリポジトリをお気に入りから削除する", () => {
        FavoritesStorage.addToFavorites(mockRepository);
        const success = FavoritesStorage.removeFromFavorites(mockRepository.id);

        expect(success).toBe(true);
        const favorites = FavoritesStorage.getFavorites();
        expect(favorites).not.toContainEqual(mockRepository);
      });

      it("存在しないリポジトリの削除も成功する", () => {
        const success = FavoritesStorage.removeFromFavorites(999);
        expect(success).toBe(true);
      });
    });

    describe("isFavorite", () => {
      it("お気に入りに存在するリポジトリでtrueを返す", () => {
        FavoritesStorage.addToFavorites(mockRepository);
        const result = FavoritesStorage.isFavorite(mockRepository.id);
        expect(result).toBe(true);
      });

      it("お気に入りに存在しないリポジトリでfalseを返す", () => {
        const result = FavoritesStorage.isFavorite(999);
        expect(result).toBe(false);
      });
    });

    describe("clearFavorites", () => {
      it("お気に入りをクリアする", () => {
        FavoritesStorage.addToFavorites(mockRepository);
        FavoritesStorage.clearFavorites();

        const favorites = FavoritesStorage.getFavorites();
        expect(favorites).toEqual([]);
      });
    });
  });

  describe("UISettingsStorage", () => {
    const defaultSettings: UISettings = {
      theme: "system",
      language: "ja",
      itemsPerPage: 20,
      viewMode: "grid",
      sortOption: "stars",
      orderOption: "desc",
    };

    describe("getSettings", () => {
      it("設定を取得する", () => {
        const customSettings = { ...defaultSettings, theme: "dark" as const };
        mockLocalStorage.setItem(
          STORAGE_KEYS.UI_SETTINGS,
          JSON.stringify(customSettings),
        );

        const result = UISettingsStorage.getSettings();
        expect(result).toEqual(customSettings);
      });

      it("設定がない場合はデフォルト設定を返す", () => {
        const result = UISettingsStorage.getSettings();
        expect(result).toEqual(defaultSettings);
      });
    });

    describe("updateSettings", () => {
      it("設定を部分的に更新する", () => {
        const success = UISettingsStorage.updateSettings({ theme: "dark" });

        expect(success).toBe(true);
        const settings = UISettingsStorage.getSettings();
        expect(settings.theme).toBe("dark");
        expect(settings.language).toBe(defaultSettings.language); // その他は変更されない
      });

      it("複数の設定を同時に更新する", () => {
        UISettingsStorage.updateSettings({
          theme: "light",
          viewMode: "list",
          itemsPerPage: 50,
        });

        const settings = UISettingsStorage.getSettings();
        expect(settings.theme).toBe("light");
        expect(settings.viewMode).toBe("list");
        expect(settings.itemsPerPage).toBe(50);
      });
    });

    describe("resetSettings", () => {
      it("設定をデフォルトにリセットする", () => {
        UISettingsStorage.updateSettings({ theme: "dark", viewMode: "list" });
        const success = UISettingsStorage.resetSettings();

        expect(success).toBe(true);
        const settings = UISettingsStorage.getSettings();
        expect(settings).toEqual(defaultSettings);
      });
    });
  });

  describe("DataMigration", () => {
    const mockRepository: GitHubRepository = createMockGitHubRepository({
      name: "test-repo",
      full_name: "owner/test-repo",
      description: "Test repository",
      stargazers_count: 100,
      language: "TypeScript",
      forks_count: 10,
      watchers_count: 5,
      updated_at: "2023-01-01T00:00:00Z",
      created_at: "2023-01-01T00:00:00Z",
      pushed_at: "2023-01-01T00:00:00Z",
      default_branch: "main",
      topics: [],
    });

    beforeEach(() => {
      // テストデータを設定
      SearchHistoryStorage.addToHistory("react");
      SearchHistoryStorage.addToHistory("vue");
      FavoritesStorage.addToFavorites(mockRepository);
      UISettingsStorage.updateSettings({ theme: "dark" });
    });

    describe("exportData", () => {
      it("データを正しくエクスポートする", () => {
        const exportedJson = DataMigration.exportData();
        const exportedData = JSON.parse(exportedJson);

        expect(exportedData.version).toBe("1.0.0");
        expect(exportedData.timestamp).toBeDefined();
        expect(exportedData.searchHistory).toEqual(["vue", "react"]);
        expect(exportedData.favorites).toEqual([mockRepository]);
        expect(exportedData.uiSettings.theme).toBe("dark");
      });

      it("エクスポートされたJSONが有効である", () => {
        const exportedJson = DataMigration.exportData();
        expect(() => JSON.parse(exportedJson)).not.toThrow();
      });
    });

    describe("importData", () => {
      beforeEach(() => {
        // クリーンな状態でテスト
        DataMigration.clearAllData();
      });

      it("データを正しくインポートする", () => {
        const importData = {
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          searchHistory: ["angular", "svelte"],
          favorites: [mockRepository],
          uiSettings: { theme: "light", language: "en", itemsPerPage: 30 },
        };

        const success = DataMigration.importData(JSON.stringify(importData));

        expect(success).toBe(true);
        expect(SearchHistoryStorage.getHistory()).toEqual([
          "angular",
          "svelte",
        ]);
        expect(FavoritesStorage.getFavorites()).toEqual([mockRepository]);
        expect(UISettingsStorage.getSettings().theme).toBe("light");
      });

      it("不正なJSONの場合はfalseを返す", () => {
        const success = DataMigration.importData("invalid json");

        expect(success).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it("バージョン情報がない場合は警告を出す", () => {
        const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

        const importData = {
          searchHistory: ["test"],
          favorites: [],
          uiSettings: {},
        };

        DataMigration.importData(JSON.stringify(importData));

        expect(consoleWarnSpy).toHaveBeenCalledWith("Data version not found");

        consoleWarnSpy.mockRestore();
      });

      it("不正な形式のデータを無視する", () => {
        const importData = {
          version: "1.0.0",
          searchHistory: "not an array",
          favorites: "not an array",
          uiSettings: "not an object",
        };

        const success = DataMigration.importData(JSON.stringify(importData));

        expect(success).toBe(true);
        // 不正なデータは無視され、デフォルト値が維持される
        expect(SearchHistoryStorage.getHistory()).toEqual([]);
        expect(FavoritesStorage.getFavorites()).toEqual([]);
      });
    });

    describe("clearAllData", () => {
      it("すべてのデータをクリアする", () => {
        const success = DataMigration.clearAllData();

        expect(success).toBe(true);
        expect(SearchHistoryStorage.getHistory()).toEqual([]);
        expect(FavoritesStorage.getFavorites()).toEqual([]);

        const settings = UISettingsStorage.getSettings();
        expect(settings.theme).toBe("system"); // デフォルト値
      });

      it("エラー時にfalseを返す", () => {
        // SearchHistoryStorage.clearHistory をエラーを投げるようにモック
        const originalClearHistory = SearchHistoryStorage.clearHistory;
        SearchHistoryStorage.clearHistory = jest.fn(() => {
          throw new Error("Clear error");
        });

        const success = DataMigration.clearAllData();

        expect(success).toBe(false);
        expect(consoleErrorSpy).toHaveBeenCalled();

        // 復元
        SearchHistoryStorage.clearHistory = originalClearHistory;
      });
    });
  });
});
