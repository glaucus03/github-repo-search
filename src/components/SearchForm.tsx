"use client";

// 検索フォームコンポーネント（ViewModelパターンで改良）
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useState, useEffect } from "react";

import { SEARCH } from "@/lib/constants";
import {
  validateSearchQuery,
  buildGitHubSearchQuery,
  generateSearchSuggestions,
  createPopularRepositoryQuery,
} from "@/lib/search-domain";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/searchStore";
import { useUIStore } from "@/store/uiStore";

interface SearchFormProps {
  onSearch?: (query: string) => void;
  className?: string;
}

export function SearchForm({ onSearch, className }: SearchFormProps) {
  const {
    query,
    setQuery,
    searchHistory,
    resetResults,
    searchOptions,
    setSearchOptions,
  } = useSearchStore();

  const {
    selectedSortOption,
    selectedOrderOption,
    setSortOption,
    setOrderOption,
  } = useUIStore();

  // 拡張フィルタ用の状態（storeと連携）
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    searchOptions.language || null,
  );
  const [minStars, setMinStars] = useState<number | null>(
    searchOptions.minStars || null,
  );
  const [maxStars, setMaxStars] = useState<number | null>(
    searchOptions.maxStars || null,
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // storeのフィルタ設定と同期
  useEffect(() => {
    setSelectedLanguage(searchOptions.language || null);
    setMinStars(searchOptions.minStars || null);
    setMaxStars(searchOptions.maxStars || null);
  }, [searchOptions]);

  // フォーム状態
  const [inputValue, setInputValue] = useState(query);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // デバウンス処理は無効化（手動検索のみ）
  // useEffect(() => {
  //   if (debouncedValue !== query) {
  //     setQuery(debouncedValue)
  //   }
  // }, [debouncedValue, query, setQuery])

  // バリデーション
  useEffect(() => {
    if (inputValue.trim()) {
      const validation = validateSearchQuery(inputValue);
      setIsValid(validation.isValid);
      setErrorMessage(validation.errors[0] || "");

      // 検索候補を生成
      if (validation.isValid) {
        const newSuggestions = generateSearchSuggestions(inputValue);
        setSuggestions(newSuggestions);
      }
    } else {
      setIsValid(true);
      setErrorMessage("");
      setSuggestions([]);
    }
  }, [inputValue]);

  // 高度な検索クエリの構築
  const buildAdvancedQuery = (baseQuery: string) => {
    const params = {
      query: baseQuery,
      language: selectedLanguage,
      minStars,
      maxStars,
      sort: selectedSortOption,
      order: selectedOrderOption,
    };

    const result = buildGitHubSearchQuery(params);

    return result;
  };

  // 検索実行
  const handleSearch = () => {
    if (!isValid || !inputValue.trim()) return;

    // storeにフィルタ設定を保存
    setSearchOptions({
      language: selectedLanguage || undefined,
      minStars: minStars || undefined,
      maxStars: maxStars || undefined,
      sort: selectedSortOption as "best-match" | "stars" | "forks" | "updated",
      order: selectedOrderOption,
    });

    const baseQuery = inputValue.trim();
    const advancedQuery = buildAdvancedQuery(baseQuery);

    setQuery(advancedQuery);
    resetResults();
    onSearch?.(advancedQuery);
    setShowSuggestions(false);
  };

  // フィルタ変更時の自動検索（既に検索されている場合のみ）
  useEffect(() => {
    // 初期状態や空の検索では自動検索しない
    if (!inputValue.trim() || !query.trim()) return;

    const debounceTimer = setTimeout(() => {
      // storeにフィルタ設定を保存
      setSearchOptions({
        language: selectedLanguage || undefined,
        minStars: minStars || undefined,
        maxStars: maxStars || undefined,
        sort: selectedSortOption as
          | "best-match"
          | "stars"
          | "forks"
          | "updated",
        order: selectedOrderOption,
      });

      const baseQuery = inputValue.trim();
      const advancedQuery = buildAdvancedQuery(baseQuery);

      // クエリが実際に変更された場合のみ実行
      if (advancedQuery !== query) {
        setQuery(advancedQuery);
        resetResults();
        onSearch?.(advancedQuery);
      }
    }, 500); // 500msの遅延で自動検索

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedLanguage,
    minStars,
    maxStars,
    selectedSortOption,
    selectedOrderOption,
  ]);

  // クイック検索（人気のリポジトリ）
  const handlePopularSearch = () => {
    const popularQuery = createPopularRepositoryQuery(
      selectedLanguage || undefined,
    );
    // テキスト入力欄には表示せず、内部的にクエリを設定
    setQuery(popularQuery);
    resetResults();
    onSearch?.(popularQuery);
  };

  // Enterキーでの検索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 履歴からの選択
  const handleHistorySelect = (selectedQuery: string) => {
    setInputValue(selectedQuery);
    setShowSuggestions(false);
  };

  // プレースホルダー（固定値でSSRエラーを回避）
  const [placeholder, setPlaceholder] = useState("リポジトリを検索...");

  // クライアントサイドでのみランダムプレースホルダーを設定
  useEffect(() => {
    const placeholders = SEARCH.PLACEHOLDER_QUERIES || [
      "react typescript",
      "vue.js components",
      "machine learning python",
      "golang microservices",
      "rust performance",
    ];
    const randomPlaceholder =
      placeholders[Math.floor(Math.random() * placeholders.length)];
    setPlaceholder(`${randomPlaceholder}を検索`);
  }, []);

  return (
    <div className={cn("max-w-4xl mx-auto mb-12", className)}>
      <div className="flex items-center gap-4 mb-4">
        {/* メイン検索入力フィールド */}
        <div className="flex-1 relative">
          <div className="flex items-center border border-gray-600 rounded-full bg-gray-800 h-14 px-6 focus-within:border-blue-500">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="flex-1 bg-transparent outline-none text-base text-white placeholder-gray-400"
            />
          </div>

          {/* エラーメッセージ */}
          {!isValid && errorMessage && (
            <div className="absolute top-full left-6 mt-2">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* 検索候補・履歴 */}
          {showSuggestions &&
            (searchHistory.length > 0 || suggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  {/* 検索履歴 */}
                  {searchHistory.length > 0 && (
                    <>
                      <div className="text-xs text-gray-400 mb-2 px-2">
                        検索履歴
                      </div>
                      {searchHistory.slice(0, 3).map((historyQuery, index) => (
                        <button
                          key={`history-${index}`}
                          onClick={() => handleHistorySelect(historyQuery)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-700 text-sm transition-colors text-white"
                        >
                          <MagnifyingGlassIcon className="w-3 h-3 inline mr-2 text-gray-400" />
                          {historyQuery}
                        </button>
                      ))}
                    </>
                  )}

                  {/* 検索候補 */}
                  {suggestions.length > 0 && (
                    <>
                      <div className="text-xs text-gray-400 mb-2 px-2 mt-2">
                        おすすめ検索
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`suggestion-${index}`}
                          onClick={() => handleHistorySelect(suggestion)}
                          className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-700 text-sm transition-colors text-white"
                        >
                          <MagnifyingGlassIcon className="w-3 h-3 inline mr-2 text-blue-400" />
                          {suggestion}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* 検索ボタン */}
        <Button
          onClick={handleSearch}
          disabled={!isValid || !inputValue.trim()}
          className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full h-14 px-8 font-medium text-base min-w-[120px]"
        >
          検索する
        </Button>

        {/* フィルターボタン */}
        <Button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={cn(
            "rounded-full h-14 w-14 bg-gray-800 border border-gray-600 hover:border-blue-500 transition-colors",
            showAdvancedFilters && "border-blue-500 bg-gray-700",
          )}
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-400" />
        </Button>
      </div>

      {/* 高度な検索フィルタ */}
      {showAdvancedFilters && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 言語選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                プログラミング言語
              </label>
              <select
                value={selectedLanguage || ""}
                onChange={(e) => setSelectedLanguage(e.target.value || null)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">すべての言語</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
              </select>
            </div>

            {/* ソート選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ソート
              </label>
              <select
                value={selectedSortOption}
                onChange={(e) =>
                  setSortOption(
                    e.target.value as
                      | "best-match"
                      | "stars"
                      | "forks"
                      | "updated",
                  )
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="best-match">関連度</option>
                <option value="stars">スター数</option>
                <option value="forks">フォーク数</option>
                <option value="updated">更新日時</option>
              </select>
            </div>

            {/* 順序選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                順序
              </label>
              <select
                value={selectedOrderOption}
                onChange={(e) =>
                  setOrderOption(e.target.value as "asc" | "desc")
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="desc">降順</option>
                <option value="asc">昇順</option>
              </select>
            </div>
          </div>

          {/* スター数範囲 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最小スター数
              </label>
              <input
                type="number"
                placeholder="0"
                value={minStars?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  setMinStars(value);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最大スター数
              </label>
              <input
                type="number"
                placeholder="無制限"
                value={maxStars?.toString() || ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  setMaxStars(value);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* フィルタクリア */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedLanguage(null);
                setMinStars(null);
                setMaxStars(null);
                setSortOption("best-match");
                setOrderOption("desc");

                // storeもクリア
                setSearchOptions({
                  language: undefined,
                  minStars: undefined,
                  maxStars: undefined,
                  sort: "best-match",
                  order: "desc",
                });
              }}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
            >
              フィルタをクリア
            </button>
          </div>
        </div>
      )}

      {/* クイック検索ボタン */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handlePopularSearch}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors"
        >
          人気のリポジトリ
        </button>
        {selectedLanguage && (
          <button
            onClick={() => {
              const query = `language:${selectedLanguage}`;
              setInputValue(query);
              handleSearch();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm font-medium transition-colors"
          >
            {selectedLanguage} プロジェクト
          </button>
        )}
      </div>
    </div>
  );
}
