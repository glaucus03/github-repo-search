// アプリケーション定数

// GitHub API関連の定数
export const GITHUB_API = {
  BASE_URL: "https://api.github.com",
  SEARCH_ENDPOINT: "/search/repositories",
  RATE_LIMIT: {
    AUTHENTICATED: 5000, // 1時間あたりのリクエスト数
    UNAUTHENTICATED: 60,
  },
  PER_PAGE: {
    DEFAULT: 30,
    MAX: 100,
  },
} as const;

// アプリケーション設定
export const APP_CONFIG = {
  NAME: "GitHub Repository Search",
  VERSION: "1.0.0",
  DESCRIPTION: "GitHub リポジトリを検索・探索できるモダンなWebアプリケーション",
  AUTHOR: "Claude Code",
  REPOSITORY: "https://github.com/example/github-search-app",
} as const;

// ページネーション設定
export const PAGINATION = {
  DEFAULT_PER_PAGE: 30,
  MAX_PER_PAGE: 100,
  MAX_RESULTS: 1000, // GitHub APIの制限
} as const;

// UI関連の定数
export const UI = {
  BREAKPOINTS: {
    SM: "640px",
    MD: "768px",
    LG: "1024px",
    XL: "1280px",
    "2XL": "1536px",
  },
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 200,
      SLOW: 300,
    },
    EASING: {
      DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      IN: "cubic-bezier(0.4, 0, 1, 1)",
      OUT: "cubic-bezier(0, 0, 0.2, 1)",
      IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
  Z_INDEX: {
    BASE: 0,
    DROPDOWN: 10,
    STICKY: 20,
    MODAL_BACKDROP: 40,
    MODAL: 50,
    TOOLTIP: 60,
    TOAST: 70,
  },
} as const;

// 検索関連の定数
export const SEARCH = {
  DEBOUNCE_DELAY: 300, // ms
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 256,
  PLACEHOLDER_QUERIES: [
    "react",
    "vue",
    "angular",
    "svelte",
    "next.js",
    "nuxt",
    "express",
    "fastapi",
    "django",
    "rails",
  ],
  SORT_OPTIONS: [
    { value: "stars", label: "スター数" },
    { value: "forks", label: "フォーク数" },
    { value: "updated", label: "更新日時" },
  ] as const,
  ORDER_OPTIONS: [
    { value: "desc", label: "降順" },
    { value: "asc", label: "昇順" },
  ] as const,
} as const;

// プログラミング言語の色設定
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#2b7489",
  Python: "#3572A5",
  Java: "#b07219",
  "C#": "#239120",
  "C++": "#f34b7d",
  C: "#555555",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#ffac45",
  Kotlin: "#F18E33",
  Dart: "#00B4AB",
  Scala: "#c22d40",
  Shell: "#89e051",
  PowerShell: "#012456",
  HTML: "#e34c26",
  CSS: "#1572B6",
  SCSS: "#c6538c",
  Less: "#1d365d",
  Vue: "#4FC08D",
  Svelte: "#ff3e00",
  Dockerfile: "#384d54",
  "Jupyter Notebook": "#DA5B0B",
  Makefile: "#427819",
  YAML: "#cb171e",
  JSON: "#292929",
  XML: "#0060ac",
  Markdown: "#083fa1",
} as const;

// ローカルストレージのキー
export const STORAGE_KEYS = {
  SEARCH_HISTORY: "github-search-history",
  UI_PREFERENCES: "github-search-ui-preferences",
  THEME: "github-search-theme",
  FAVORITES: "github-search-favorites",
  RECENT_VIEWS: "github-search-recent-views",
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "ネットワークエラーが発生しました。接続を確認してください。",
  API_ERROR: "GitHub APIエラーが発生しました。",
  RATE_LIMIT_EXCEEDED:
    "API制限に達しました。しばらく待ってから再試行してください。",
  REPOSITORY_NOT_FOUND: "リポジトリが見つかりませんでした。",
  SEARCH_ERROR: "検索中にエラーが発生しました。",
  VALIDATION_ERROR: "入力内容に問題があります。",
  UNKNOWN_ERROR: "予期しないエラーが発生しました。",
} as const;

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  SEARCH_COMPLETED: "検索が完了しました。",
  DATA_LOADED: "データの読み込みが完了しました。",
  FAVORITE_ADDED: "お気に入りに追加しました。",
  FAVORITE_REMOVED: "お気に入りから削除しました。",
} as const;

// 正規表現パターン
export const REGEX_PATTERNS = {
  GITHUB_REPO_URL: /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/,
  GITHUB_USER_URL: /^https:\/\/github\.com\/([^\/]+)\/?$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
} as const;

// デフォルト値
export const DEFAULTS = {
  THEME: "system" as const,
  LANGUAGE: "ja" as const,
  RESULTS_PER_PAGE: 30,
  SEARCH_SORT: "stars" as const,
  SEARCH_ORDER: "desc" as const,
} as const;

// APIレスポンス制限
export const API_LIMITS = {
  MAX_SEARCH_RESULTS: 1000,
  MAX_CONTRIBUTORS_DISPLAY: 30,
  MAX_LANGUAGES_DISPLAY: 10,
  MAX_README_LENGTH: 50000, // 文字数
} as const;

// タイムアウト設定
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10秒
  DEBOUNCE: 300, // 300ms
  TOAST_DISPLAY: 5000, // 5秒
  LOADING_DELAY: 100, // 100ms
} as const;

// フィーチャーフラグ
export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: true,
  ENABLE_FAVORITES: true,
  ENABLE_SEARCH_HISTORY: true,
  ENABLE_ANALYTICS: false,
  ENABLE_NOTIFICATIONS: true,
} as const;
