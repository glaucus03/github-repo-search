// テスト用のユーティリティとヘルパー関数

import type {
  GitHubRepository,
  GitHubUser,
  GitHubRateLimit,
} from "@/types/github";

/**
 * テスト用のGitHubUserオブジェクトを作成
 */
export function createMockGitHubUser(
  overrides: Partial<GitHubUser> = {},
): GitHubUser {
  return {
    login: "test-user",
    id: 1,
    node_id: "MDQ6VXNlcjE=",
    avatar_url: "https://example.com/avatar.png",
    gravatar_id: null,
    url: "https://api.github.com/users/test-user",
    html_url: "https://github.com/test-user",
    followers_url: "https://api.github.com/users/test-user/followers",
    following_url:
      "https://api.github.com/users/test-user/following{/other_user}",
    gists_url: "https://api.github.com/users/test-user/gists{/gist_id}",
    starred_url:
      "https://api.github.com/users/test-user/starred{/owner}{/repo}",
    subscriptions_url: "https://api.github.com/users/test-user/subscriptions",
    organizations_url: "https://api.github.com/users/test-user/orgs",
    repos_url: "https://api.github.com/users/test-user/repos",
    events_url: "https://api.github.com/users/test-user/events{/privacy}",
    received_events_url:
      "https://api.github.com/users/test-user/received_events",
    type: "User",
    site_admin: false,
    ...overrides,
  };
}

/**
 * テスト用のGitHubRepositoryオブジェクトを作成
 */
export function createMockGitHubRepository(
  overrides: Partial<GitHubRepository> = {},
): GitHubRepository {
  return {
    id: 1,
    node_id: "MDEwOlJlcG9zaXRvcnkx",
    name: "test-repo",
    full_name: "test-user/test-repo",
    private: false,
    owner: createMockGitHubUser(),
    html_url: "https://github.com/test-user/test-repo",
    description: "Test repository description",
    fork: false,
    url: "https://api.github.com/repos/test-user/test-repo",
    archive_url:
      "https://api.github.com/repos/test-user/test-repo/{archive_format}{/ref}",
    assignees_url:
      "https://api.github.com/repos/test-user/test-repo/assignees{/user}",
    blobs_url:
      "https://api.github.com/repos/test-user/test-repo/git/blobs{/sha}",
    branches_url:
      "https://api.github.com/repos/test-user/test-repo/branches{/branch}",
    collaborators_url:
      "https://api.github.com/repos/test-user/test-repo/collaborators{/collaborator}",
    comments_url:
      "https://api.github.com/repos/test-user/test-repo/comments{/number}",
    commits_url:
      "https://api.github.com/repos/test-user/test-repo/commits{/sha}",
    compare_url:
      "https://api.github.com/repos/test-user/test-repo/compare/{base}...{head}",
    contents_url:
      "https://api.github.com/repos/test-user/test-repo/contents/{+path}",
    contributors_url:
      "https://api.github.com/repos/test-user/test-repo/contributors",
    deployments_url:
      "https://api.github.com/repos/test-user/test-repo/deployments",
    downloads_url: "https://api.github.com/repos/test-user/test-repo/downloads",
    events_url: "https://api.github.com/repos/test-user/test-repo/events",
    forks_url: "https://api.github.com/repos/test-user/test-repo/forks",
    git_commits_url:
      "https://api.github.com/repos/test-user/test-repo/git/commits{/sha}",
    git_refs_url:
      "https://api.github.com/repos/test-user/test-repo/git/refs{/sha}",
    git_tags_url:
      "https://api.github.com/repos/test-user/test-repo/git/tags{/sha}",
    git_url: "git://github.com/test-user/test-repo.git",
    issue_comment_url:
      "https://api.github.com/repos/test-user/test-repo/issues/comments{/number}",
    issue_events_url:
      "https://api.github.com/repos/test-user/test-repo/issues/events{/number}",
    issues_url:
      "https://api.github.com/repos/test-user/test-repo/issues{/number}",
    keys_url: "https://api.github.com/repos/test-user/test-repo/keys{/key_id}",
    labels_url:
      "https://api.github.com/repos/test-user/test-repo/labels{/name}",
    languages_url: "https://api.github.com/repos/test-user/test-repo/languages",
    merges_url: "https://api.github.com/repos/test-user/test-repo/merges",
    milestones_url:
      "https://api.github.com/repos/test-user/test-repo/milestones{/number}",
    notifications_url:
      "https://api.github.com/repos/test-user/test-repo/notifications{?since,all,participating}",
    pulls_url:
      "https://api.github.com/repos/test-user/test-repo/pulls{/number}",
    releases_url:
      "https://api.github.com/repos/test-user/test-repo/releases{/id}",
    ssh_url: "git@github.com:test-user/test-repo.git",
    stargazers_url:
      "https://api.github.com/repos/test-user/test-repo/stargazers",
    statuses_url:
      "https://api.github.com/repos/test-user/test-repo/statuses/{sha}",
    subscribers_url:
      "https://api.github.com/repos/test-user/test-repo/subscribers",
    subscription_url:
      "https://api.github.com/repos/test-user/test-repo/subscription",
    tags_url: "https://api.github.com/repos/test-user/test-repo/tags",
    teams_url: "https://api.github.com/repos/test-user/test-repo/teams",
    trees_url:
      "https://api.github.com/repos/test-user/test-repo/git/trees{/sha}",
    clone_url: "https://github.com/test-user/test-repo.git",
    mirror_url: null,
    hooks_url: "https://api.github.com/repos/test-user/test-repo/hooks",
    svn_url: "https://github.com/test-user/test-repo",
    homepage: null,
    language: "TypeScript",
    forks_count: 10,
    stargazers_count: 100,
    watchers_count: 5,
    size: 1000,
    default_branch: "main",
    open_issues_count: 2,
    is_template: false,
    topics: ["react", "typescript"],
    has_issues: true,
    has_projects: true,
    has_wiki: true,
    has_pages: false,
    has_downloads: true,
    archived: false,
    disabled: false,
    visibility: "public",
    pushed_at: "2023-01-01T00:00:00Z",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    permissions: {
      admin: false,
      maintain: false,
      push: false,
      triage: false,
      pull: true,
    },
    temp_clone_token: "",
    delete_branch_on_merge: false,
    license: {
      key: "mit",
      name: "MIT License",
      spdx_id: "MIT",
      url: "https://api.github.com/licenses/mit",
      node_id: "MDc6TGljZW5zZW1pdA==",
    },
    forks: 10,
    open_issues: 2,
    watchers: 5,
    network_count: 15,
    subscribers_count: 8,
    ...overrides,
  };
}

/**
 * テスト用のGitHubRateLimitオブジェクトを作成
 */
export function createMockGitHubRateLimit(
  overrides: Partial<GitHubRateLimit> = {},
): GitHubRateLimit {
  return {
    limit: 5000,
    remaining: 4999,
    reset: 1609459200,
    used: 1,
    resource: "core",
    ...overrides,
  };
}

/**
 * テスト用のResponseモックを作成
 */
export function createMockResponse(
  data: unknown,
  options: Partial<Response> = {},
): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "https://api.github.com/test",
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
    ...options,
  } as Response;
}

/**
 * テスト用のエラーResponseモックを作成
 */
export function createMockErrorResponse(
  error: unknown,
  status = 404,
): Response {
  return createMockResponse(error, {
    ok: false,
    status,
    statusText: status === 404 ? "Not Found" : "Error",
    json: () => Promise.resolve(error),
  });
}
