"use client";

// クライアントコンポーネントでは動的レンダリング設定を削除

// リポジトリ詳細ページ
import {
  StarIcon,
  EyeIcon,
  CodeBracketIcon,
  CalendarDaysIcon,
  LinkIcon,
  DocumentTextIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import { Card, CardBody, Avatar, Chip, Button, Link } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RepositoryDetailSkeleton, MarkdownPreview } from "@/components";
import { StructuredData, SEOMonitor } from "@/components/SEO";
import { useRepositoryDetail } from "@/hooks/useRepositoryDetail";
import { LANGUAGE_COLORS } from "@/lib/constants";
import {
  generateRepositoryStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/seo";
import { formatNumber, formatRelativeTime, formatDate } from "@/lib/utils";

interface RepositoryPageProps {
  params: Promise<{
    owner: string;
    name: string;
  }>;
}

export default function RepositoryPage({ params }: RepositoryPageProps) {
  const router = useRouter();
  const [ownerParam, setOwnerParam] = useState("");
  const [nameParam, setNameParam] = useState("");

  // paramsを解決
  useEffect(() => {
    params.then(({ owner, name }) => {
      setOwnerParam(owner);
      setNameParam(name);
    });
  }, [params]);

  const { repository, readme, languageStats, isLoading, error, readmeError } =
    useRepositoryDetail(ownerParam, nameParam, {
      enabled: !!ownerParam && !!nameParam,
    });

  if (isLoading) {
    return <RepositoryDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="search-container">
        <Card className="max-w-2xl mx-auto">
          <CardBody className="text-center py-12">
            <div className="text-danger text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">
              リポジトリが見つかりません
            </h2>
            <p className="text-default-500 mb-6">{error}</p>
            <Button color="primary" onClick={() => router.push("/")}>
              検索ページに戻る
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!repository) {
    return null;
  }

  // パンくずリストのデータ
  const breadcrumbItems = [
    { name: "ホーム", url: "/" },
    { name: "リポジトリ", url: "/search" },
    {
      name: `${ownerParam}/${nameParam}`,
      url: `/repository/${ownerParam}/${nameParam}`,
    },
  ];

  return (
    <>
      {/* 構造化データ */}
      {repository && (
        <StructuredData data={generateRepositoryStructuredData(repository)} />
      )}
      <StructuredData
        data={generateBreadcrumbStructuredData(breadcrumbItems)}
      />

      {/* SEO監視 */}
      <SEOMonitor />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* メインコンテンツ */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* リポジトリヒーロー部分 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <div className="flex items-center gap-4 mb-2">
              {/* オーナーアバター */}
              <Avatar
                src={repository.owner.avatar_url}
                alt={`${repository.owner.login}のアバター`}
                size="lg"
                className="w-12 h-12"
              />

              {/* リポジトリ名とリンク */}
              <Link
                href={repository.html_url}
                target="_blank"
                className="group flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0"
              >
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white truncate">
                  {repository.name}
                </h1>
                <svg
                  className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </Link>

              {/* ステータスチップ */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {repository.private && (
                  <Chip size="sm" color="warning" variant="flat">
                    Private
                  </Chip>
                )}
                {repository.archived && (
                  <Chip size="sm" color="default" variant="flat">
                    Archived
                  </Chip>
                )}
              </div>
            </div>

            {/* オーナー情報 */}
            <Link
              href={`https://github.com/${repository.owner.login}`}
              isExternal
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 text-lg mb-4 hover:text-blue-500 transition-colors"
            >
              <span className="font-medium">by {repository.owner.login}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </Link>

            {repository.description && (
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">
                {repository.description}
              </p>
            )}

            {/* メイン統計情報 */}
            <div className="flex items-center gap-8 mb-6">
              <div className="flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(repository.stargazers_count)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">stars</span>
              </div>
              <div className="flex items-center gap-2">
                <CodeBracketIcon className="w-5 h-5 text-blue-500" />
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(repository.forks_count)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">forks</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeIcon className="w-5 h-5 text-green-500" />
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(repository.watchers_count)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  watching
                </span>
              </div>
            </div>
          </div>

          {/* 3列の統合セクション：トピック、統計情報、使用言語 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* トピック */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  トピック
                </h3>
                {repository.topics.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {repository.topics.slice(0, 6).map((topic) => (
                      <Chip
                        key={topic}
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="text-xs"
                      >
                        {topic}
                      </Chip>
                    ))}
                    {repository.topics.length > 6 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{repository.topics.length - 6} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    トピックが設定されていません
                  </p>
                )}

                {/* ライセンス情報 */}
                {repository.license && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <ScaleIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {repository.license.name}
                      </span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* 統計情報 */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  統計情報
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Issues
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatNumber(repository.open_issues_count)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        作成日
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(repository.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        更新日
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatRelativeTime(new Date(repository.updated_at))}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* 使用言語 */}
            <Card className="shadow-sm">
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  使用言語
                </h3>
                {languageStats ? (
                  <div className="space-y-2">
                    {languageStats.languages.slice(0, 3).map((lang) => (
                      <div key={lang.language} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  LANGUAGE_COLORS[lang.language] || "#6B7280",
                              }}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {lang.language}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {lang.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className="h-1 rounded-full"
                            style={{
                              backgroundColor:
                                LANGUAGE_COLORS[lang.language] || "#6B7280",
                              width: `${lang.percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {languageStats.languages.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        +{languageStats.languages.length - 3} more languages
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    言語情報を取得中...
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          {/* README */}
          <Card className="shadow-sm mb-8">
            <CardBody className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <DocumentTextIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  README
                </h2>
              </div>
              {readme ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
                  <MarkdownPreview
                    content={readme}
                    repositoryInfo={{
                      owner: repository.owner.login,
                      name: repository.name,
                      branch: repository.default_branch || "main",
                    }}
                  />
                  {readme.length > 15000 && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        as={Link}
                        href={`${repository.html_url}#readme`}
                        target="_blank"
                        variant="light"
                        color="primary"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <LinkIcon className="w-4 h-4" />
                        GitHub で全文を読む
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">
                    {readmeError || "README が見つかりません"}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
