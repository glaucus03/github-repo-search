"use client";

// アプリケーション初期化プロバイダー
import { Spinner } from "@heroui/react";
import { useEffect, useState } from "react";

import { useSearchStore } from "@/store/searchStore";
import { useUIStore } from "@/store/uiStore";

interface InitializationProviderProps {
  children: React.ReactNode;
}

export function InitializationProvider({
  children,
}: InitializationProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  const loadHistory = useSearchStore((state) => state.loadHistory);
  const loadFavorites = useUIStore((state) => state.loadFavorites);

  useEffect(() => {
    // 少し遅延を追加して初期化を確実に完了させる
    const timer = setTimeout(() => {
      try {
        // ストレージからデータを読み込み（エラーを無視）
        try {
          loadHistory();
        } catch (e) {
          console.warn("Failed to load history:", e);
        }

        try {
          loadFavorites();
        } catch (e) {
          console.warn("Failed to load favorites:", e);
        }

        // テーマの初期設定
        try {
          const uiStore = useUIStore.getState();
          if (uiStore.theme === "system") {
            const mediaQuery = window.matchMedia(
              "(prefers-color-scheme: dark)",
            );
            document.documentElement.classList.toggle(
              "dark",
              mediaQuery.matches,
            );
          } else {
            document.documentElement.classList.toggle(
              "dark",
              uiStore.theme === "dark",
            );
          }
        } catch (e) {
          console.warn("Failed to set theme:", e);
        }

        // 初期化完了
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        // エラーが発生しても初期化完了とする
        setIsInitialized(true);
      }
    }, 100); // 100ms遅延

    return () => clearTimeout(timer);
  }, [loadHistory, loadFavorites]);

  // テーマ変更の監視
  useEffect(() => {
    try {
      const unsubscribe = useUIStore.subscribe((state) => {
        try {
          if (state.theme === "system") {
            const mediaQuery = window.matchMedia(
              "(prefers-color-scheme: dark)",
            );
            document.documentElement.classList.toggle(
              "dark",
              mediaQuery.matches,
            );
          } else {
            document.documentElement.classList.toggle(
              "dark",
              state.theme === "dark",
            );
          }
        } catch (e) {
          console.warn("Failed to update theme:", e);
        }
      });

      return unsubscribe;
    } catch (e) {
      console.warn("Failed to setup theme subscription:", e);
      return () => {};
    }
  }, []);

  // 初期化中の表示
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-default-500">
            アプリケーションを初期化しています...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
