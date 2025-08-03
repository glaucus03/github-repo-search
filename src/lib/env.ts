// 環境変数の型定義と検証

export interface EnvironmentConfig {
  // GitHub API
  githubApiUrl: string;
  githubToken?: string;

  // アプリケーション設定
  appName: string;
  appVersion: string;
  appEnv: string;

  // API制限
  githubApiRateLimitPerHour: number;
  githubApiRateLimitPerMinute: number;

  // 検索設定
  defaultSearchLimit: number;
  maxSearchResults: number;
}

// 環境変数の取得と検証
export function getEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    githubApiUrl: process.env.GITHUB_API_URL || "https://api.github.com",
    githubToken: process.env.GITHUB_TOKEN,
    appName: process.env.NEXT_PUBLIC_APP_NAME || "GitHub Repository Search",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    appEnv: process.env.NEXT_PUBLIC_APP_ENV || "development",
    githubApiRateLimitPerHour: parseInt(
      process.env.GITHUB_API_RATE_LIMIT_PER_HOUR || "5000",
      10,
    ),
    githubApiRateLimitPerMinute: parseInt(
      process.env.GITHUB_API_RATE_LIMIT_PER_MINUTE || "60",
      10,
    ),
    defaultSearchLimit: parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_SEARCH_LIMIT || "30",
      10,
    ),
    maxSearchResults: parseInt(
      process.env.NEXT_PUBLIC_MAX_SEARCH_RESULTS || "1000",
      10,
    ),
  };

  // 必須環境変数の検証（本番環境のみ）
  if (process.env.NODE_ENV === "production" && !config.githubToken) {
    console.warn(
      "GitHub Token が設定されていません。API制限により検索が制限される可能性があります。",
    );
  }

  return config;
}

// クライアントサイド用の環境変数（NEXT_PUBLIC_のみ）
export function getClientEnvironmentConfig() {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || "GitHub Repository Search",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    appEnv: process.env.NEXT_PUBLIC_APP_ENV || "development",
    defaultSearchLimit: parseInt(
      process.env.NEXT_PUBLIC_DEFAULT_SEARCH_LIMIT || "30",
      10,
    ),
    maxSearchResults: parseInt(
      process.env.NEXT_PUBLIC_MAX_SEARCH_RESULTS || "1000",
      10,
    ),
  };
}
