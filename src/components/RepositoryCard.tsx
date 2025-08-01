'use client'

// リポジトリカードコンポーネント
import { 
  StarIcon, 
  EyeIcon, 
  CodeBracketIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { Card, CardBody, CardFooter, Avatar, Chip, Link, Button } from '@heroui/react'

import { LANGUAGE_COLORS } from '@/lib/constants'
import { cn, formatNumber, formatRelativeTime, truncateText } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import type { GitHubRepository } from '@/types/github'

interface RepositoryCardProps {
  repository: GitHubRepository
  onSelect?: (repository: GitHubRepository) => void
  className?: string
  variant?: 'default' | 'compact'
}

export function RepositoryCard({ 
  repository, 
  onSelect, 
  className,
  variant = 'default' 
}: RepositoryCardProps) {
  const { isFavorite, addToFavorites, removeFromFavorites, addNotification } = useUIStore()
  const isFav = isFavorite(repository.id)

  const handleClick = () => {
    onSelect?.(repository)
  }

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isFav) {
      removeFromFavorites(repository.id)
      addNotification({
        type: 'success',
        message: 'お気に入りから削除しました',
      })
    } else {
      addToFavorites(repository)
      addNotification({
        type: 'success',
        message: 'お気に入りに追加しました',
      })
    }
  }

  const languageColor = repository.language 
    ? LANGUAGE_COLORS[repository.language] || '#6B7280'
    : '#6B7280'

  const isCompact = variant === 'compact'

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
          <Avatar
            src={repository.owner.avatar_url}
            alt={repository.owner.login}
            size={isCompact ? 'sm' : 'md'}
            className="flex-shrink-0"
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
              
              <div className="flex items-center gap-2">
                {/* プライベートリポジトリバッジ */}
                {repository.private && (
                  <Chip size="sm" variant="flat" color="warning">
                    Private
                  </Chip>
                )}
                
                {/* お気に入りボタン */}
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color={isFav ? "danger" : "default"}
                  onClick={handleFavoriteToggle}
                  aria-label={isFav ? "お気に入りから削除" : "お気に入りに追加"}
                >
                  {isFav ? (
                    <HeartIconSolid className="w-4 h-4" />
                  ) : (
                    <HeartIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 説明文 */}
        {repository.description && (
          <p className={cn(
            'text-default-600 mb-4 flex-1',
            isCompact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
          )}>
            {isCompact 
              ? truncateText(repository.description, 80)
              : truncateText(repository.description, 120)
            }
          </p>
        )}

        {/* 統計情報 */}
        <div className={cn(
          'flex items-center gap-4 mb-4',
          isCompact ? 'text-xs' : 'text-sm'
        )}>
          {/* スター数 */}
          <div className="flex items-center gap-1 text-default-500">
            <StarIcon className={cn('flex-shrink-0', isCompact ? 'w-3 h-3' : 'w-4 h-4')} />
            <span>{formatNumber(repository.stargazers_count)}</span>
          </div>

          {/* フォーク数 */}
          <div className="flex items-center gap-1 text-default-500">
            <CodeBracketIcon className={cn('flex-shrink-0', isCompact ? 'w-3 h-3' : 'w-4 h-4')} />
            <span>{formatNumber(repository.forks_count)}</span>
          </div>

          {/* ウォッチャー数 */}
          <div className="flex items-center gap-1 text-default-500">
            <EyeIcon className={cn('flex-shrink-0', isCompact ? 'w-3 h-3' : 'w-4 h-4')} />
            <span>{formatNumber(repository.watchers_count)}</span>
          </div>
        </div>

        {/* 言語とトピック */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* プログラミング言語 */}
          {repository.language && (
            <div className="flex items-center gap-1">
              <div 
                className={cn('rounded-full', isCompact ? 'w-2 h-2' : 'w-3 h-3')}
                style={{ backgroundColor: languageColor }}
              />
              <span className={cn('text-default-600', isCompact ? 'text-xs' : 'text-sm')}>
                {repository.language}
              </span>
            </div>
          )}

          {/* トピック（コンパクト版では最初の2つのみ） */}
          {repository.topics.slice(0, isCompact ? 2 : 3).map((topic) => (
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

          {repository.topics.length > (isCompact ? 2 : 3) && (
            <span className={cn('text-default-400', isCompact ? 'text-xs' : 'text-sm')}>
              +{repository.topics.length - (isCompact ? 2 : 3)}
            </span>
          )}
        </div>

        {/* 更新日時 */}
        <div className={cn(
          'flex items-center gap-1 text-default-400 mt-auto',
          isCompact ? 'text-xs' : 'text-sm'
        )}>
          <CalendarDaysIcon className={cn('flex-shrink-0', isCompact ? 'w-3 h-3' : 'w-4 h-4')} />
          <span>
            {formatRelativeTime(new Date(repository.updated_at))}に更新
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
    </Card>
  )
}