// ローカルストレージユーティリティ
import type { GitHubRepository } from "@/types/github";

// ストレージキー定数
export const STORAGE_KEYS = {
  SEARCH_HISTORY: "github-search-history",
  FAVORITES: "github-search-favorites",
  UI_SETTINGS: "github-search-ui-settings",
  SEARCH_SETTINGS: "github-search-settings",
} as const;

// 型安全なローカルストレージ操作
export class LocalStorageManager {
  private static isClient = typeof window !== "undefined";

  // 安全にアイテムを取得
  static getItem<T>(key: string, defaultValue: T): T {
    try {
      if (!this.isClient) return defaultValue;

      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;

      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error);
      return defaultValue;
    }
  }

  // 安全にアイテムを設定
  static setItem<T>(key: string, value: T): boolean {
    try {
      if (!this.isClient) return false;

      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Failed to set item in localStorage: ${key}`, error);
      return false;
    }
  }

  // 安全にアイテムを削除
  static removeItem(key: string): boolean {
    try {
      if (!this.isClient) return false;

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error);
      return false;
    }
  }

  // ストレージをクリア
  static clear(): boolean {
    try {
      if (!this.isClient) return false;

      localStorage.clear();
      return true;
    } catch (error) {
      console.warn("Failed to clear localStorage", error);
      return false;
    }
  }

  // ストレージサイズを計算
  static getStorageSize(): number {
    if (!this.isClient) return 0;

    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }
}

// 検索履歴の管理
export class SearchHistoryStorage {
  private static readonly MAX_HISTORY_SIZE = 50;

  static getHistory(): string[] {
    return LocalStorageManager.getItem(STORAGE_KEYS.SEARCH_HISTORY, []);
  }

  static addToHistory(query: string): void {
    if (!query.trim()) return;

    const history = this.getHistory();
    const normalizedQuery = query.trim();

    // 既存のクエリを削除（重複防止）
    const filteredHistory = history.filter((item) => item !== normalizedQuery);

    // 先頭に追加
    const newHistory = [normalizedQuery, ...filteredHistory];

    // 最大数を超えた場合は古いものを削除
    if (newHistory.length > this.MAX_HISTORY_SIZE) {
      newHistory.splice(this.MAX_HISTORY_SIZE);
    }

    LocalStorageManager.setItem(STORAGE_KEYS.SEARCH_HISTORY, newHistory);
  }

  static removeFromHistory(query: string): void {
    const history = this.getHistory();
    const filteredHistory = history.filter((item) => item !== query);
    LocalStorageManager.setItem(STORAGE_KEYS.SEARCH_HISTORY, filteredHistory);
  }

  static clearHistory(): void {
    LocalStorageManager.setItem(STORAGE_KEYS.SEARCH_HISTORY, []);
  }
}

// お気に入りリポジトリの管理
export class FavoritesStorage {
  private static readonly MAX_FAVORITES_SIZE = 100;

  static getFavorites(): GitHubRepository[] {
    return LocalStorageManager.getItem(STORAGE_KEYS.FAVORITES, []);
  }

  static addToFavorites(repository: GitHubRepository): boolean {
    const favorites = this.getFavorites();

    // 既に存在するかチェック
    const existingIndex = favorites.findIndex(
      (repo) => repo.id === repository.id,
    );
    if (existingIndex !== -1) {
      return false; // 既に存在する
    }

    // 最大数をチェック
    if (favorites.length >= this.MAX_FAVORITES_SIZE) {
      return false; // 上限に達している
    }

    const newFavorites = [repository, ...favorites];
    return LocalStorageManager.setItem(STORAGE_KEYS.FAVORITES, newFavorites);
  }

  static removeFromFavorites(repositoryId: number): boolean {
    const favorites = this.getFavorites();
    const filteredFavorites = favorites.filter(
      (repo) => repo.id !== repositoryId,
    );
    return LocalStorageManager.setItem(
      STORAGE_KEYS.FAVORITES,
      filteredFavorites,
    );
  }

  static isFavorite(repositoryId: number): boolean {
    const favorites = this.getFavorites();
    return favorites.some((repo) => repo.id === repositoryId);
  }

  static clearFavorites(): void {
    LocalStorageManager.setItem(STORAGE_KEYS.FAVORITES, []);
  }
}

// UI設定の管理
export interface UISettings {
  theme: "light" | "dark" | "system";
  language: "ja" | "en";
  itemsPerPage: number;
  viewMode: "grid" | "list";
  sortOption: "stars" | "forks" | "updated";
  orderOption: "desc" | "asc";
}

export class UISettingsStorage {
  private static readonly DEFAULT_SETTINGS: UISettings = {
    theme: "system",
    language: "ja",
    itemsPerPage: 20,
    viewMode: "grid",
    sortOption: "stars",
    orderOption: "desc",
  };

  static getSettings(): UISettings {
    return LocalStorageManager.getItem(
      STORAGE_KEYS.UI_SETTINGS,
      this.DEFAULT_SETTINGS,
    );
  }

  static updateSettings(updates: Partial<UISettings>): boolean {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    return LocalStorageManager.setItem(STORAGE_KEYS.UI_SETTINGS, newSettings);
  }

  static resetSettings(): boolean {
    return LocalStorageManager.setItem(
      STORAGE_KEYS.UI_SETTINGS,
      this.DEFAULT_SETTINGS,
    );
  }
}

// データ移行とバックアップ
export class DataMigration {
  // データをエクスポート
  static exportData() {
    const data = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      searchHistory: SearchHistoryStorage.getHistory(),
      favorites: FavoritesStorage.getFavorites(),
      uiSettings: UISettingsStorage.getSettings(),
    };

    return JSON.stringify(data, null, 2);
  }

  // データをインポート
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      // バージョンチェック（将来的な互換性のため）
      if (!data.version) {
        console.warn("Data version not found");
      }

      // データの復元
      if (data.searchHistory && Array.isArray(data.searchHistory)) {
        LocalStorageManager.setItem(
          STORAGE_KEYS.SEARCH_HISTORY,
          data.searchHistory,
        );
      }

      if (data.favorites && Array.isArray(data.favorites)) {
        LocalStorageManager.setItem(STORAGE_KEYS.FAVORITES, data.favorites);
      }

      if (data.uiSettings && typeof data.uiSettings === "object") {
        LocalStorageManager.setItem(STORAGE_KEYS.UI_SETTINGS, data.uiSettings);
      }

      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }

  // データをクリア
  static clearAllData(): boolean {
    try {
      SearchHistoryStorage.clearHistory();
      FavoritesStorage.clearFavorites();
      UISettingsStorage.resetSettings();
      return true;
    } catch (error) {
      console.error("Failed to clear all data:", error);
      return false;
    }
  }
}
