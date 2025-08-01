'use client'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

// 検索履歴ページ
import {
  ClockIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { Card, CardBody, Button, Input, Chip } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

import { formatRelativeTime } from '@/lib/utils'
import { useSearchStore } from '@/store/searchStore'
import { useUIStore } from '@/store/uiStore'

interface SearchHistoryItem {
  query: string
  timestamp: Date
  resultCount?: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  const { searchHistory, clearHistory, removeFromHistory } = useSearchStore()
  const { addNotification } = useUIStore()

  // 履歴アイテムをタイムスタンプ付きオブジェクトに変換（実際の実装では、より詳細な履歴データを保存する）
  const historyItems: SearchHistoryItem[] = useMemo(() => {
    return searchHistory.map((query, index) => ({
      query,
      timestamp: new Date(Date.now() - index * 60000), // 仮のタイムスタンプ
      resultCount: Math.floor(Math.random() * 10000), // 仮の結果数
    }))
  }, [searchHistory])

  // 検索フィルタリング
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return historyItems
    
    const query = searchQuery.toLowerCase()
    return historyItems.filter(item => 
      item.query.toLowerCase().includes(query)
    )
  }, [historyItems, searchQuery])

  // 履歴から検索実行
  const handleSearchFromHistory = (query: string) => {
    router.push(`/?q=${encodeURIComponent(query)}`)
  }

  // 履歴から削除
  const handleRemoveFromHistory = (query: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeFromHistory(query)
    addNotification({
      type: 'success',
      message: '履歴から削除しました',
    })
  }

  // 全削除
  const handleClearAll = () => {
    if (window.confirm('すべての検索履歴を削除しますか？')) {
      clearHistory()
      addNotification({
        type: 'success',
        message: '検索履歴をクリアしました',
      })
    }
  }

  if (searchHistory.length === 0) {
    return (
      <div className="search-container py-16">
        <Card className="max-w-2xl mx-auto">
          <CardBody className="text-center py-12">
            <ClockIcon className="w-16 h-16 mx-auto text-default-300 mb-6" />
            <h1 className="text-2xl font-bold mb-4">検索履歴</h1>
            <p className="text-default-500 mb-8">
              まだ検索履歴がありません。
              <br />
              リポジトリを検索すると、ここに履歴が表示されます。
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
          <h1 className="text-3xl font-bold mb-2">検索履歴</h1>
          <p className="text-default-600">
            {searchHistory.length}件の検索履歴があります
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
          placeholder="履歴から検索..."
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
            {filteredHistory.length}件の結果が見つかりました
          </p>
        </div>
      )}

      {/* 履歴リスト */}
      {filteredHistory.length === 0 && searchQuery ? (
        <Card className="max-w-2xl mx-auto">
          <CardBody className="text-center py-12">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-default-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">検索結果が見つかりません</h2>
            <p className="text-default-500">
              「{searchQuery}」に一致する検索履歴がありません
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, index) => (
            <Card 
              key={`${item.query}-${index}`}
              className="cursor-pointer hover:bg-default-50 transition-colors group"
              isPressable
              onPress={() => handleSearchFromHistory(item.query)}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <MagnifyingGlassIcon className="w-5 h-5 text-default-400 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground truncate">
                          {item.query}
                        </p>
                        {item.resultCount && (
                          <Chip size="sm" variant="flat" color="primary">
                            {item.resultCount.toLocaleString()}件
                          </Chip>
                        )}
                      </div>
                      <p className="text-sm text-default-500">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      endContent={<ArrowRightIcon className="w-3 h-3" />}
                    >
                      検索
                    </Button>
                    
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleRemoveFromHistory(item.query, e)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* 最近の検索キーワード */}
      {!searchQuery && filteredHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">よく検索されるキーワード</h2>
          <div className="flex flex-wrap gap-2">
            {/* 仮の人気キーワード（実際の実装では、検索頻度を集計する） */}
            {['React', 'Vue', 'TypeScript', 'Python', 'Next.js', 'Node.js'].map((keyword) => (
              <Button
                key={keyword}
                variant="flat"
                size="sm"
                onClick={() => handleSearchFromHistory(keyword)}
              >
                {keyword}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}