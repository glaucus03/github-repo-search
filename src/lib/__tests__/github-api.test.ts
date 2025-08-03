import type {
  GitHubSearchResponse,
  GitHubRepository,
  GitHubRateLimit,
} from "@/types/github";

import {
  createMockGitHubRepository,
  createMockGitHubRateLimit,
  createMockErrorResponse,
} from "../../test-utils";
import {
  GitHubApiClient,
  githubApi,
  createSearchQuery,
  decodeReadmeContent,
  isGitHubApiError,
  checkRateLimit,
} from "../github-api";

// Mock dependencies
jest.mock("../env", () => ({
  getEnvironmentConfig: jest.fn(() => ({
    githubApiUrl: "https://api.github.com",
    githubToken: "test-token",
  })),
}));

jest.mock("../errorHandler", () => ({
  handleGitHubAPIError: jest.fn((error) => error),
  retryWithBackoff: jest.fn(async (fn) => await fn()),
  logError: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("GitHubApiClient", () => {
  let client: GitHubApiClient;

  beforeEach(() => {
    client = new GitHubApiClient();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("環境設定から正しく初期化される", () => {
      expect(client).toBeInstanceOf(GitHubApiClient);
    });
  });

  describe("request", () => {
    it("成功レスポンスを正しく処理する", async () => {
      const mockData = { test: "data" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await (
        client as unknown as { request: (path: string) => Promise<unknown> }
      ).request("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            Authorization: "token test-token",
          }),
        }),
      );
      expect(result).toEqual(mockData);
    });

    it("エラーレスポンスを正しく処理する", async () => {
      const mockError = { message: "API Error", documentation_url: "" };
      mockFetch.mockResolvedValueOnce(createMockErrorResponse(mockError, 404));

      await expect(
        (
          client as unknown as { request: (path: string) => Promise<unknown> }
        ).request("/test"),
      ).rejects.toThrow();
    });

    it("JSON解析エラーを処理する", async () => {
      mockFetch.mockResolvedValueOnce(createMockErrorResponse({}, 500));

      await expect(
        (
          client as unknown as { request: (path: string) => Promise<unknown> }
        ).request("/test"),
      ).rejects.toThrow();
    });
  });

  describe("searchRepositories", () => {
    it("検索クエリを正しく実行する", async () => {
      const mockResponse: GitHubSearchResponse = {
        total_count: 1,
        incomplete_results: false,
        items: [
          createMockGitHubRepository({
            name: "test-repo",
            full_name: "owner/test-repo",
            description: "Test repository",
            stargazers_count: 100,
            language: "TypeScript",
            forks_count: 10,
            updated_at: "2023-01-01T00:00:00Z",
            created_at: "2023-01-01T00:00:00Z",
            pushed_at: "2023-01-01T00:00:00Z",
            default_branch: "main",
            topics: [],
          }),
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const query = {
        q: "react",
        sort: "stars" as const,
        order: "desc" as const,
        per_page: 10,
        page: 1,
      };

      const result = await client.searchRepositories(query);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/search/repositories?q=react&sort=stars&order=desc&per_page=10&page=1",
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getRepository", () => {
    it("特定のリポジトリ情報を取得する", async () => {
      const mockRepo: GitHubRepository = createMockGitHubRepository({
        name: "test-repo",
        full_name: "owner/test-repo",
        description: "Test repository",
        stargazers_count: 100,
        language: "TypeScript",
        forks_count: 10,
        updated_at: "2023-01-01T00:00:00Z",
        created_at: "2023-01-01T00:00:00Z",
        pushed_at: "2023-01-01T00:00:00Z",
        default_branch: "main",
        topics: [],
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRepo),
      } as Response);

      const result = await client.getRepository("owner", "test-repo");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/owner/test-repo",
        expect.any(Object),
      );
      expect(result).toEqual(mockRepo);
    });
  });

  describe("getRepositoryLanguages", () => {
    it("リポジトリの言語情報を取得する", async () => {
      const mockLanguages = { JavaScript: 1000, TypeScript: 500 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLanguages),
      } as Response);

      const result = await client.getRepositoryLanguages("owner", "repo");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/owner/repo/languages",
        expect.any(Object),
      );
      expect(result).toEqual(mockLanguages);
    });
  });

  describe("getRepositoryContributors", () => {
    it("リポジトリのコントリビューターを取得する", async () => {
      const mockContributors = [
        {
          login: "contributor1",
          id: 1,
          avatar_url: "https://example.com/avatar1.png",
          contributions: 10,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockContributors),
      } as Response);

      const result = await client.getRepositoryContributors("owner", "repo");

      expect(result).toEqual(mockContributors);
    });
  });

  describe("getRepositoryReadme", () => {
    it("リポジトリのREADMEを取得する", async () => {
      const mockReadme = {
        name: "README.md",
        content: btoa("# Test README"),
        encoding: "base64" as const,
        size: 100,
        sha: "test-sha",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockReadme),
      } as Response);

      const result = await client.getRepositoryReadme("owner", "repo");

      expect(result).toEqual(mockReadme);
    });
  });

  describe("getRateLimit", () => {
    it("レート制限情報を取得する", async () => {
      const mockRateLimit: GitHubRateLimit = {
        ...createMockGitHubRateLimit(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rate: mockRateLimit }),
      } as Response);

      const result = await client.getRateLimit();

      expect(result).toEqual(mockRateLimit);
    });
  });

  describe("getPopularRepositories", () => {
    it("人気のリポジトリを取得する", async () => {
      const mockResponse: GitHubSearchResponse = {
        total_count: 1,
        incomplete_results: false,
        items: [
          createMockGitHubRepository({
            name: "test-repo",
            full_name: "owner/test-repo",
            description: "Test repository",
            stargazers_count: 100,
            language: "TypeScript",
            forks_count: 10,
            updated_at: "2023-01-01T00:00:00Z",
            created_at: "2023-01-01T00:00:00Z",
            pushed_at: "2023-01-01T00:00:00Z",
            default_branch: "main",
            topics: [],
          }),
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.getPopularRepositories("javascript", 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("q=stars%3A%3E1+language%3Ajavascript"),
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse.items);
    });
  });

  describe("getRecentlyUpdatedRepositories", () => {
    it("最近更新されたリポジトリを取得する", async () => {
      const mockResponse: GitHubSearchResponse = {
        total_count: 1,
        incomplete_results: false,
        items: [
          createMockGitHubRepository({
            name: "test-repo",
            full_name: "owner/test-repo",
            description: "Test repository",
            stargazers_count: 100,
            language: "TypeScript",
            forks_count: 10,
            updated_at: "2023-01-01T00:00:00Z",
            created_at: "2023-01-01T00:00:00Z",
            pushed_at: "2023-01-01T00:00:00Z",
            default_branch: "main",
            topics: [],
          }),
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.getRecentlyUpdatedRepositories("typescript");

      expect(result).toEqual(mockResponse.items);
    });
  });
});

describe("ヘルパー関数", () => {
  describe("createSearchQuery", () => {
    it("基本的な検索クエリを作成する", () => {
      const result = createSearchQuery("react");
      expect(result).toBe("react");
    });

    it("言語フィルターを追加する", () => {
      const result = createSearchQuery("vue", { language: "javascript" });
      expect(result).toBe("vue language:javascript");
    });

    it("スター数の範囲フィルターを追加する", () => {
      const result = createSearchQuery("angular", {
        minStars: 100,
        maxStars: 1000,
      });
      expect(result).toBe("angular stars:100..1000");
    });

    it("最小スター数のみのフィルターを追加する", () => {
      const result = createSearchQuery("svelte", { minStars: 50 });
      expect(result).toBe("svelte stars:>=50");
    });

    it("最大スター数のみのフィルターを追加する", () => {
      const result = createSearchQuery("ember", { maxStars: 200 });
      expect(result).toBe("ember stars:<=200");
    });

    it("作成日フィルターを追加する", () => {
      const result = createSearchQuery("nextjs", { created: ">2023-01-01" });
      expect(result).toBe("nextjs created:>2023-01-01");
    });

    it("プッシュ日フィルターを追加する", () => {
      const result = createSearchQuery("nuxt", { pushed: ">2023-06-01" });
      expect(result).toBe("nuxt pushed:>2023-06-01");
    });

    it("複数のオプションを組み合わせる", () => {
      const result = createSearchQuery("gatsby", {
        language: "javascript",
        minStars: 100,
        created: ">2022-01-01",
      });
      expect(result).toBe(
        "gatsby language:javascript stars:>=100 created:>2022-01-01",
      );
    });
  });

  describe("decodeReadmeContent", () => {
    it("Base64エンコードされた内容をデコードする", () => {
      const encoded = btoa("# Test README\n\nThis is a test.");
      const result = decodeReadmeContent(encoded);
      expect(result).toBe("# Test README\n\nThis is a test.");
    });

    it("無効なBase64の場合は元の内容を返す", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const invalid = "invalid-base64-content";
      const result = decodeReadmeContent(invalid);

      expect(result).toBe(invalid);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("isGitHubApiError", () => {
    it("有効なGitHubApiErrorオブジェクトを識別する", () => {
      const error = { message: "API Error", documentation_url: "" };
      expect(isGitHubApiError(error)).toBe(true);
    });

    it("無効なオブジェクトを識別する", () => {
      expect(isGitHubApiError(null)).toBe(false);
      expect(isGitHubApiError(undefined)).toBe(false);
      expect(isGitHubApiError("string")).toBe(false);
      expect(isGitHubApiError({})).toBe(false);
      expect(isGitHubApiError({ message: 123 })).toBe(false);
    });
  });

  describe("checkRateLimit", () => {
    it("レート制限情報を正しく解析する", () => {
      const rateLimit: GitHubRateLimit = createMockGitHubRateLimit({
        remaining: 100,
        used: 4900,
      });

      const result = checkRateLimit(rateLimit);

      expect(result.isLimited).toBe(false);
      expect(result.remainingRequests).toBe(100);
      expect(result.resetDate).toEqual(new Date(1609459200 * 1000));
    });

    it("レート制限に達した状態を検出する", () => {
      const rateLimit: GitHubRateLimit = createMockGitHubRateLimit({
        remaining: 0,
        used: 5000,
      });

      const result = checkRateLimit(rateLimit);

      expect(result.isLimited).toBe(true);
      expect(result.remainingRequests).toBe(0);
    });
  });
});

describe("シングルトンインスタンス", () => {
  it("githubApiがGitHubApiClientのインスタンスである", () => {
    expect(githubApi).toBeInstanceOf(GitHubApiClient);
  });
});
