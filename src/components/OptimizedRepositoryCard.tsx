'use client'

// 最適化されたリポジトリカードコンポーネント
import { 
  StarIcon, 
  EyeIcon, 
  CodeBracketIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import { Card, CardBody, CardFooter, Avatar, Chip, Link, Button } from '@heroui/react'
import React, { memo, useMemo } from 'react'

import { usePerformanceMonitor, useLazyImage } from '@/hooks/usePerformance'
import { LANGUAGE_COLORS } from '@/lib/constants'
import { cn, formatNumber, formatRelativeTime, truncateText } from '@/lib/utils'
import type { GitHubRepository } from '@/types/github'

interface OptimizedRepositoryCardProps {
  repository: GitHubRepository
  onSelect?: (repository: GitHubRepository) => void
  className?: string
  variant?: 'default' | 'compact'
  isVisible?: boolean // 仮想化での可視性制御
}

// メモ化されたアバターコンポーネント
const MemoizedAvatar = memo(({ src, alt, size }: { src: string; alt: string; size: 'sm' | 'md' }) => {
  const { imgRef, src: lazySrc, isLoaded, hasError } = useLazyImage(src)
  
  return (
    <div ref={imgRef}>
      <Avatar
        src={isLoaded && !hasError ? lazySrc : undefined}
        alt={alt}
        size={size}
        className="flex-shrink-0"
        showFallback={!isLoaded || hasError}
      />
    </div>
  )
})

MemoizedAvatar.displayName = 'MemoizedAvatar'

// メモ化された統計コンポーネント
const MemoizedStats = memo(({ 
  stars, 
  forks, 
  watchers, 
  isCompact 
}: { 
  stars: number
  forks: number
  watchers: number
  isCompact: boolean 
}) => {
  const iconSize = isCompact ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = isCompact ? 'text-xs' : 'text-sm'

  return (
    <div className={cn('flex items-center gap-4 mb-4', textSize)}>
      {/* スター数 */}
      <div className="flex items-center gap-1 text-default-500">
        <StarIcon className={cn('flex-shrink-0', iconSize)} />
        <span>{formatNumber(stars)}</span>
      </div>

      {/* フォーク数 */}
      <div className="flex items-center gap-1 text-default-500">
        <CodeBracketIcon className={cn('flex-shrink-0', iconSize)} />
        <span>{formatNumber(forks)}</span>
      </div>

      {/* ウォッチャー数 */}
      <div className="flex items-center gap-1 text-default-500">
        <EyeIcon className={cn('flex-shrink-0', iconSize)} />
        <span>{formatNumber(watchers)}</span>
      </div>
    </div>
  )
})

MemoizedStats.displayName = 'MemoizedStats'

// メモ化された言語・トピックコンポーネント
const MemoizedLanguageAndTopics = memo(({ 
  language, 
  topics, 
  isCompact 
}: { 
  language: string | null
  topics: string[]
  isCompact: boolean 
}) => {
  const languageColor = useMemo(() => 
    language ? LANGUAGE_COLORS[language] || '#6B7280' : '#6B7280',
    [language]
  )

  const displayTopics = useMemo(() => 
    topics.slice(0, isCompact ? 2 : 3),
    [topics, isCompact]
  )

  const remainingCount = topics.length - displayTopics.length

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* プログラミング言語 */}
      {language && (
        <div className="flex items-center gap-1">
          <div 
            className={cn('rounded-full', isCompact ? 'w-2 h-2' : 'w-3 h-3')}
            style={{ backgroundColor: languageColor }}
          />
          <span className={cn('text-default-600', isCompact ? 'text-xs' : 'text-sm')}>
            {language}
          </span>
        </div>
      )}

      {/* トピック */}
      {displayTopics.map((topic) => (
        <Chip
          key={topic}
          size="sm"
          variant="flat"
          color="primary"
          className={isCompact ? 'text-xs' : ''}
        >
          {topic}
        </Chip>
      ))}

      {remainingCount > 0 && (
        <span className={cn('text-default-400', isCompact ? 'text-xs' : 'text-sm')}>
          +{remainingCount}
        </span>
      )}
    </div>
  )
})

MemoizedLanguageAndTopics.displayName = 'MemoizedLanguageAndTopics'

// メインコンポーネント
function OptimizedRepositoryCardComponent({ 
  repository, 
  onSelect, 
  className,
  variant = 'default',
  isVisible = true
}: OptimizedRepositoryCardProps) {
  // パフォーマンス監視（開発環境のみ）
  const metrics = usePerformanceMonitor(`RepositoryCard-${repository.id}`)

  const isCompact = variant === 'compact'

  // クリックハンドラをメモ化
  const handleClick = useMemo(() => 
    () => onSelect?.(repository),
    [onSelect, repository]
  )

  // 説明文をメモ化
  const truncatedDescription = useMemo(() => {
    if (!repository.description) return null
    return isCompact 
      ? truncateText(repository.description, 80)
      : truncateText(repository.description, 120)
  }, [repository.description, isCompact])

  // 更新日時をメモ化
  const formattedUpdateTime = useMemo(() => 
    formatRelativeTime(new Date(repository.updated_at)),
    [repository.updated_at]
  )

  // 可視性制御（仮想化用）
  if (!isVisible) {
    return (
      <div 
        className={cn(
          'repository-card-placeholder',
          isCompact ? 'h-auto' : 'h-[200px]',
          className
        )}
      />
    )
  }

  return (
    <Card 
      className={cn(
        'repository-card cursor-pointer transition-all duration-200 hover:scale-[1.02]',
        isCompact ? 'h-auto' : 'h-full min-h-[200px]',
        className
      )}
      isPressable
      onPress={handleClick}
    >
      <CardBody className={cn('flex flex-col', isCompact ? 'p-4' : 'p-6')}>
        {/* ヘッダー部分 */}
        <div className="flex items-start gap-3 mb-3">
          <MemoizedAvatar
            src={repository.owner.avatar_url}
            alt={repository.owner.login}
            size={isCompact ? 'sm' : 'md'}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className={cn(
                  'font-semibold truncate text-foreground',
                  isCompact ? 'text-sm' : 'text-base'
                )}>
                  {repository.name}
                </h3>
                <p className={cn(
                  'text-default-500 truncate',
                  isCompact ? 'text-xs' : 'text-sm'
                )}>
                  {repository.owner.login}
                </p>
              </div>
              
              {/* プライベートリポジトリバッジ */}
              {repository.private && (
                <Chip size="sm" variant="flat" color="warning">
                  Private
                </Chip>
              )}
            </div>
          </div>
        </div>

        {/* 説明文 */}
        {truncatedDescription && (
          <p className={cn(
            'text-default-600 mb-4 flex-1',
            isCompact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
          )}>
            {truncatedDescription}
          </p>
        )}

        {/* 統計情報 */}
        <MemoizedStats
          stars={repository.stargazers_count}
          forks={repository.forks_count}
          watchers={repository.watchers_count}
          isCompact={isCompact}
        />

        {/* 言語とトピック */}
        <MemoizedLanguageAndTopics
          language={repository.language}
          topics={repository.topics}
          isCompact={isCompact}
        />

        {/* 更新日時 */}
        <div className={cn(
          'flex items-center gap-1 text-default-400 mt-auto',
          isCompact ? 'text-xs' : 'text-sm'
        )}>
          <CalendarDaysIcon className={cn('flex-shrink-0', isCompact ? 'w-3 h-3' : 'w-4 h-4')} />
          <span>
            {formattedUpdateTime}に更新
          </span>
        </div>
      </CardBody>

      {/* フッター（非コンパクト版のみ） */}
      {!isCompact && (
        <CardFooter className="border-t px-6 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {/* ライセンス */}
              {repository.license && (
                <Chip size="sm" variant="flat" color="default">
                  {repository.license.name}
                </Chip>
              )}

              {/* アーカイブ済み */}
              {repository.archived && (
                <Chip size="sm" variant="flat" color="warning">
                  Archived
                </Chip>
              )}

              {/* テンプレート */}
              {repository.is_template && (
                <Chip size="sm" variant="flat" color="secondary">
                  Template
                </Chip>
              )}
            </div>

            {/* 外部リンクボタン */}
            <Button
              as={Link}
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              size="sm"
              isIconOnly
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      )}

      {/* 開発環境でのパフォーマンス情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 opacity-0 hover:opacity-100 transition-opacity">
          <div className="bg-black/80 text-white text-xs p-1 rounded">
            Renders: {metrics.updateCount}
          </div>
        </div>
      )}
    </Card>
  )
}

// メモ化の条件をカスタマイズ
export const OptimizedRepositoryCard = memo(OptimizedRepositoryCardComponent, (prevProps, nextProps) => {
  // 最適化されたメモ化条件
  return (
    prevProps.repository.id === nextProps.repository.id &&
    prevProps.variant === nextProps.variant &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.className === nextProps.className &&
    prevProps.onSelect === nextProps.onSelect
  )
})