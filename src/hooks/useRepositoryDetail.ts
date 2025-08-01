// リポジトリ詳細情報取得用のカスタムHook
import { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { decodeReadmeContent } from '@/lib/github-api'
import type {
  GitHubRepository,
  GitHubLanguage,
  GitHubContributor,
  GitHubReadmeResponse
} from '@/types/github'

interface UseRepositoryDetailOptions {
  enabled?: boolean
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  refreshInterval?: number
  loadLanguages?: boolean
  loadContributors?: boolean
  loadReadme?: boolean
  maxContributors?: number
}

interface RepositoryDetailData {
  repository: GitHubRepository | null
  languages: GitHubLanguage | null
  contributors: GitHubContributor[] | null
  readme: string | null
  readmeError: string | null
}

// APIフェッチャー関数
const fetcher = async (url: string) => {
  const response = await fetch(url)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'APIエラーが発生しました')
  }
  
  return response.json()
}

export function useRepositoryDetail(
  owner: string,
  repo: string,
  options: UseRepositoryDetailOptions = {}
) {
  const {
    enabled = true,
    revalidateOnFocus = false,
    revalidateOnReconnect = true,
    refreshInterval = 0,
    loadLanguages = true,
    loadContributors = true,
    loadReadme = true,
    maxContributors = 30,
  } = options

  // メインのリポジトリ情報を取得（API Route経由）
  const {
    data: repository,
    error: repositoryError,
    isLoading: repositoryLoading,
    mutate: mutateRepository,
  } = useSWR<GitHubRepository>(
    enabled && owner && repo ? `/api/repositories/${owner}/${repo}` : null,
    fetcher,
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      refreshInterval,
    }
  )

  // 言語情報を取得（API Route経由）
  const {
    data: languages,
    error: languagesError,
    isLoading: languagesLoading,
    mutate: mutateLanguages,
  } = useSWR<GitHubLanguage>(
    enabled && loadLanguages && owner && repo 
      ? `/api/repositories/${owner}/${repo}?include_languages=true` 
      : null,
    async (url) => {
      const data = await fetcher(url)
      return data.languages
    },
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      refreshInterval,
    }
  )

  // コントリビューター情報を取得（API Route経由）
  const {
    data: allContributors,
    error: contributorsError,
    isLoading: contributorsLoading,
    mutate: mutateContributors,
  } = useSWR<GitHubContributor[]>(
    enabled && loadContributors && owner && repo 
      ? `/api/repositories/${owner}/${repo}?include_contributors=true` 
      : null,
    async (url) => {
      const data = await fetcher(url)
      return data.contributors
    },
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      refreshInterval,
    }
  )

  // README情報を取得（API Route経由）
  const {
    data: readmeData,
    error: readmeError,
    isLoading: readmeLoading,
    mutate: mutateReadme,
  } = useSWR<GitHubReadmeResponse>(
    enabled && loadReadme && owner && repo 
      ? `/api/repositories/${owner}/${repo}?include_readme=true` 
      : null,
    async (url) => {
      const data = await fetcher(url)
      return data.readme
    },
    {
      revalidateOnFocus,
      revalidateOnReconnect,
      refreshInterval,
      // READMEが存在しない場合のエラーは無視
      shouldRetryOnError: false,
    }
  )

  // 処理済みデータの生成
  const processedData = useMemo<RepositoryDetailData>(() => {
    // コントリビューターの制限
    const contributors = allContributors ? allContributors.slice(0, maxContributors) : null

    // READMEのデコード
    let readme: string | null = null
    let readmeErrorMessage: string | null = null

    if (readmeData?.content) {
      try {
        readme = decodeReadmeContent(readmeData.content)
      } catch {
        readmeErrorMessage = 'READMEの読み込みに失敗しました'
      }
    } else if (readmeError) {
      readmeErrorMessage = 'READMEが見つかりません'
    }

    return {
      repository: repository || null,
      languages: languages || null,
      contributors,
      readme,
      readmeError: readmeErrorMessage,
    }
  }, [repository, languages, allContributors, readmeData, readmeError, maxContributors])

  // 言語統計の計算
  const languageStats = useMemo(() => {
    if (!languages) return null

    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
    const stats = Object.entries(languages)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: Math.round((bytes / total) * 100 * 10) / 10, // 小数点第1位まで
      }))
      .sort((a, b) => b.bytes - a.bytes)

    return {
      languages: stats,
      total,
      primaryLanguage: stats[0]?.language || null,
    }
  }, [languages])

  // 統計情報の計算
  const repositoryStats = useMemo(() => {
    if (!repository) return null

    return {
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      watchers: repository.watchers_count,
      openIssues: repository.open_issues_count,
      size: repository.size,
      createdAt: new Date(repository.created_at),
      updatedAt: new Date(repository.updated_at),
      pushedAt: repository.pushed_at ? new Date(repository.pushed_at) : null,
      isArchived: repository.archived,
      isDisabled: repository.disabled,
      isTemplate: repository.is_template,
      isFork: repository.fork,
      hasIssues: repository.has_issues,
      hasWiki: repository.has_wiki,
      hasPages: repository.has_pages,
      hasDownloads: repository.has_downloads,
      license: repository.license,
      topics: repository.topics,
    }
  }, [repository])

  // 全データの再取得関数
  const refresh = useCallback(async () => {
    const promises: Promise<unknown>[] = [mutateRepository()]
    
    if (loadLanguages) promises.push(mutateLanguages())
    if (loadContributors) promises.push(mutateContributors())
    if (loadReadme) promises.push(mutateReadme())

    await Promise.all(promises)
  }, [mutateRepository, mutateLanguages, mutateContributors, mutateReadme, loadLanguages, loadContributors, loadReadme])

  // ローディング状態の計算
  const isLoading = repositoryLoading || 
    (loadLanguages && languagesLoading) || 
    (loadContributors && contributorsLoading) || 
    (loadReadme && readmeLoading)

  // エラー状態の計算
  const errorState = repositoryError || languagesError || contributorsError

  // URL生成ヘルパー
  const urls = useMemo(() => {
    if (!repository) return null
    
    return {
      repository: repository.html_url,
      issues: `${repository.html_url}/issues`,
      pulls: `${repository.html_url}/pulls`,
      wiki: repository.has_wiki ? `${repository.html_url}/wiki` : null,
      releases: `${repository.html_url}/releases`,
      contributors: `${repository.html_url}/graphs/contributors`,
      insights: `${repository.html_url}/pulse`,
      clone: {
        https: repository.clone_url,
        ssh: repository.ssh_url,
      },
    }
  }, [repository])

  return {
    // 基本データ
    ...processedData,
    
    // 処理済みデータ
    languageStats,
    repositoryStats,
    urls,
    
    // 状態
    isLoading,
    error: errorState?.message || null,
    
    // 個別のローディング状態
    repositoryLoading,
    languagesLoading,
    contributorsLoading,
    readmeLoading,
    
    // 個別のエラー状態
    repositoryError: repositoryError?.message || null,
    languagesError: languagesError?.message || null,
    contributorsError: contributorsError?.message || null,
    
    // アクション
    refresh,
  }
}