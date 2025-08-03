// GitHub API クライアント
import type {
  GitHubRepository,
  GitHubSearchResponse,
  GitHubSearchQuery,
  GitHubApiError,
  GitHubLanguage,
  GitHubContributor,
  GitHubReadmeResponse,
  GitHubRateLimit,
} from "@/types/github";

import { getEnvironmentConfig } from "./env";
import {
  handleGitHubAPIError,
  retryWithBackoff,
  logError,
  // catchAndLog
} from "./errorHandler";

export class GitHubApiClient {
  private baseUrl: string;
  private token?: string;

  constructor() {
    const config = getEnvironmentConfig();
    this.baseUrl = config.githubApiUrl;
    this.token = config.githubToken;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: GitHubApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `HTTP Error: ${response.status}`,
            documentation_url: "",
          };
        }

        // GitHub API固有のエラーオブジェクトを作成
        const apiError = new Error(errorData.message) as Error & {
          response: {
            status: number;
            statusText: string;
            headers: Record<string, string>;
            data: GitHubApiError;
          };
          config: {
            url: string;
            method: string;
          };
        };
        apiError.response = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: errorData,
        };
        apiError.config = { url, method: options?.method || "GET" };

        throw apiError;
      }

      return await response.json();
    } catch (error) {
      // エラーをログに記録
      logError(error, `GitHub API ${endpoint}`);

      // GitHub API固有のエラー処理
      throw handleGitHubAPIError(error);
    }
  }

  // リポジトリ検索（再試行機能付き）
  async searchRepositories(
    query: GitHubSearchQuery,
  ): Promise<GitHubSearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append("q", query.q);

    if (query.sort) searchParams.append("sort", query.sort);
    if (query.order) searchParams.append("order", query.order);
    if (query.per_page)
      searchParams.append("per_page", query.per_page.toString());
    if (query.page) searchParams.append("page", query.page.toString());

    return retryWithBackoff(
      () =>
        this.request<GitHubSearchResponse>(
          `/search/repositories?${searchParams.toString()}`,
        ),
      2, // 最大2回再試行
      1000, // 1秒のベースディレイ
    );
  }

  // 特定のリポジトリ情報を取得（再試行機能付き）
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return retryWithBackoff(
      () => this.request<GitHubRepository>(`/repos/${owner}/${repo}`),
      2,
      1000,
    );
  }

  // リポジトリの言語情報を取得
  async getRepositoryLanguages(
    owner: string,
    repo: string,
  ): Promise<GitHubLanguage> {
    return this.request<GitHubLanguage>(`/repos/${owner}/${repo}/languages`);
  }

  // リポジトリのコントリビューターを取得
  async getRepositoryContributors(
    owner: string,
    repo: string,
  ): Promise<GitHubContributor[]> {
    return this.request<GitHubContributor[]>(
      `/repos/${owner}/${repo}/contributors`,
    );
  }

  // リポジトリのREADMEを取得
  async getRepositoryReadme(
    owner: string,
    repo: string,
  ): Promise<GitHubReadmeResponse> {
    return this.request<GitHubReadmeResponse>(`/repos/${owner}/${repo}/readme`);
  }

  // レート制限情報を取得
  async getRateLimit(): Promise<GitHubRateLimit> {
    const response = await this.request<{ rate: GitHubRateLimit }>(
      "/rate_limit",
    );
    return response.rate;
  }

  // 人気のリポジトリを取得（検索クエリを使用）
  async getPopularRepositories(
    language?: string,
    limit = 30,
  ): Promise<GitHubRepository[]> {
    let query = "stars:>1";

    if (language) {
      query += ` language:${language}`;
    }

    const searchQuery: GitHubSearchQuery = {
      q: query,
      sort: "stars",
      order: "desc",
      per_page: limit,
    };

    const response = await this.searchRepositories(searchQuery);
    return response.items;
  }

  // 最近更新されたリポジトリを取得
  async getRecentlyUpdatedRepositories(
    language?: string,
    limit = 30,
  ): Promise<GitHubRepository[]> {
    let query = "stars:>10";

    if (language) {
      query += ` language:${language}`;
    }

    const searchQuery: GitHubSearchQuery = {
      q: query,
      sort: "updated",
      order: "desc",
      per_page: limit,
    };

    const response = await this.searchRepositories(searchQuery);
    return response.items;
  }
}

// シングルトンインスタンス
export const githubApi = new GitHubApiClient();

// ヘルパー関数
export function createSearchQuery(
  query: string,
  options: {
    language?: string;
    sort?: "stars" | "forks" | "updated";
    order?: "desc" | "asc";
    minStars?: number;
    maxStars?: number;
    created?: string;
    pushed?: string;
  } = {},
): string {
  let searchQuery = query;

  if (options.language) {
    searchQuery += ` language:${options.language}`;
  }

  if (options.minStars !== undefined) {
    if (options.maxStars !== undefined) {
      searchQuery += ` stars:${options.minStars}..${options.maxStars}`;
    } else {
      searchQuery += ` stars:>=${options.minStars}`;
    }
  } else if (options.maxStars !== undefined) {
    searchQuery += ` stars:<=${options.maxStars}`;
  }

  if (options.created) {
    searchQuery += ` created:${options.created}`;
  }

  if (options.pushed) {
    searchQuery += ` pushed:${options.pushed}`;
  }

  return searchQuery;
}

// README内容をデコードするヘルパー関数
export function decodeReadmeContent(content: string): string {
  try {
    return atob(content);
  } catch (error) {
    console.error("README内容のデコードに失敗しました:", error);
    return content;
  }
}

// エラーハンドリング用のヘルパー関数
export function isGitHubApiError(error: unknown): error is GitHubApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

// レート制限チェック用のヘルパー関数
export function checkRateLimit(rateLimit: GitHubRateLimit): {
  isLimited: boolean;
  resetDate: Date;
  remainingRequests: number;
} {
  return {
    isLimited: rateLimit.remaining === 0,
    resetDate: new Date(rateLimit.reset * 1000),
    remainingRequests: rateLimit.remaining,
  };
}
