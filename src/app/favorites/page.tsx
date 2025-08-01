'use client'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

// お気に入りページ
import {
  HeartIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { Card, CardBody, Button, Input } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

import { RepositoryCard } from '@/components'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'

export default function FavoritesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  const { favorites, removeFromFavorites, clearAllFavorites } = useUIStore()

  // 検索フィルタリング
  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favorites
    
    const query = searchQuery.toLowerCase()
    return favorites.filter(repo => 
      repo.name.toLowerCase().includes(query) ||
      repo.owner.login.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query) ||
      repo.topics.some(topic => topic.toLowerCase().includes(query))
    )
  }, [favorites, searchQuery])

  // リポジトリ選択
  const handleRepositorySelect = (repository: any) => {
    router.push(`/repository/${repository.owner.login}/${repository.name}`)
  }

  // お気に入りから削除
  const handleRemoveFavorite = (repositoryId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    removeFromFavorites(repositoryId)
  }

  // 全削除
  const handleClearAll = () => {
    if (window.confirm('すべてのお気に入りを削除しますか？')) {
      clearAllFavorites()
    }
  }

  if (favorites.length === 0) {
    return (
      <div className="search-container py-16">
        <Card className="max-w-2xl mx-auto">
          <CardBody className="text-center py-12">
            <HeartIcon className="w-16 h-16 mx-auto text-default-300 mb-6" />
            <h1 className="text-2xl font-bold mb-4">お気に入りリポジトリ</h1>
            <p className="text-default-500 mb-8">
              まだお気に入りに追加されたリポジトリがありません。
              <br />
              検索してお気に入りのプロジェクトを見つけましょう。
            </p>
            <Button
              color="primary"
              size="lg"
              onClick={() => router.push('/')}
            >
              リポジトリを検索
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="search-container py-8">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">お気に入りリポジトリ</h1>
          <p className="text-default-600">
            {favorites.length}件のリポジトリがお気に入りに追加されています
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="flat"
            color="danger"
            onClick={handleClearAll}
            startContent={<TrashIcon className="w-4 h-4" />}
          >
            全削除
          </Button>
        </div>
      </div>

      {/* 検索フィルター */}
      <div className="mb-6">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="お気に入りから検索..."
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
          size="lg"
          classNames={{
            input: "text-base",
            inputWrapper: "h-12",
          }}
        />
      </div>

      {/* 結果統計 */}
      {searchQuery && (
        <div className="mb-6">
          <p className="text-center text-default-500">
            {filteredFavorites.length}件の結果が見つかりました
          </p>
        </div>
      )}

      {/* お気に入りリスト */}
      {filteredFavorites.length === 0 && searchQuery ? (
        <Card className="max-w-2xl mx-auto">
          <CardBody className="text-center py-12">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-default-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">検索結果が見つかりません</h2>
            <p className="text-default-500">
              「{searchQuery}」に一致するお気に入りリポジトリがありません
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((repository) => (
            <div key={repository.id} className="relative group">
              <RepositoryCard
                repository={repository}
                onSelect={handleRepositorySelect}
                className="h-full"
              />
              
              {/* 削除ボタン */}
              <Button
                isIconOnly
                color="danger"
                variant="flat"
                size="sm"
                className={cn(
                  "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                  "bg-danger/10 hover:bg-danger/20"
                )}
                onClick={(e) => handleRemoveFavorite(repository.id, e)}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}