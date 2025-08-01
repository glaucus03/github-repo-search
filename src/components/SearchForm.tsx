'use client'

// 検索フォームコンポーネント
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { Button, Input, Select, SelectItem, Card, CardBody } from '@heroui/react'
import { useState, useEffect } from 'react'

import { useDebounce } from '@/hooks/useDebounce'
import { SEARCH } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { validateSearchQuery } from '@/lib/validators'
import { useSearchStore } from '@/store/searchStore'
import { useUIStore } from '@/store/uiStore'

interface SearchFormProps {
  onSearch?: (query: string) => void
  className?: string
}

export function SearchForm({ onSearch, className }: SearchFormProps) {
  const {
    query,
    setQuery,
    searchHistory,
    resetResults,
  } = useSearchStore()

  const {
    isSearchFormExpanded,
    selectedSortOption,
    selectedOrderOption,
    toggleSearchForm,
    setSortOption,
    setOrderOption,
  } = useUIStore()

  const [inputValue, setInputValue] = useState(query)
  const [isValid, setIsValid] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // デバウンス処理
  const debouncedValue = useDebounce(inputValue, SEARCH.DEBOUNCE_DELAY)

  // デバウンスされた値でクエリを更新
  useEffect(() => {
    if (debouncedValue !== query) {
      setQuery(debouncedValue)
    }
  }, [debouncedValue, query, setQuery])

  // バリデーション
  useEffect(() => {
    if (inputValue.trim()) {
      const validation = validateSearchQuery(inputValue)
      setIsValid(validation.isValid)
      setErrorMessage(validation.errors[0] || '')
    } else {
      setIsValid(true)
      setErrorMessage('')
    }
  }, [inputValue])

  // 検索実行
  const handleSearch = () => {
    if (!isValid || !inputValue.trim()) return

    const trimmedQuery = inputValue.trim()
    setQuery(trimmedQuery)
    resetResults()
    onSearch?.(trimmedQuery)
    setShowSuggestions(false)
  }

  // Enterキーでの検索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 履歴からの選択
  const handleHistorySelect = (selectedQuery: string) => {
    setInputValue(selectedQuery)
    setShowSuggestions(false)
  }

  // プレースホルダーのランダム選択
  const getRandomPlaceholder = () => {
    const placeholders = SEARCH.PLACEHOLDER_QUERIES
    return placeholders[Math.floor(Math.random() * placeholders.length)]
  }

  const [placeholder] = useState(() => `${getRandomPlaceholder()}を検索...`)

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      <Card className="p-4">
        <CardBody>
          {/* メインの検索入力 */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholder}
                startContent={<MagnifyingGlassIcon className="w-5 h-5 text-default-400" />}
                isInvalid={!isValid}
                errorMessage={errorMessage}
                size="lg"
                classNames={{
                  input: "text-base",
                  inputWrapper: "h-12",
                }}
              />

              {/* 検索候補・履歴 */}
              {showSuggestions && searchHistory.length > 0 && (
                <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto">
                  <CardBody className="p-2">
                    <div className="text-xs text-default-500 mb-2 px-2">検索履歴</div>
                    {searchHistory.slice(0, 5).map((historyQuery, index) => (
                      <button
                        key={index}
                        onClick={() => handleHistorySelect(historyQuery)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-default-100 text-sm transition-colors"
                      >
                        <MagnifyingGlassIcon className="w-3 h-3 inline mr-2 text-default-400" />
                        {historyQuery}
                      </button>
                    ))}
                  </CardBody>
                </Card>
              )}
            </div>

            <Button
              onClick={handleSearch}
              color="primary"
              size="lg"
              isDisabled={!isValid || !inputValue.trim()}
              className="px-8"
            >
              検索
            </Button>

            <Button
              onClick={toggleSearchForm}
              variant="flat"
              size="lg"
              isIconOnly
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* 詳細検索オプション */}
          {isSearchFormExpanded && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ソート順 */}
                <div>
                  <label className="block text-sm font-medium mb-2">並び順</label>
                  <Select
                    selectedKeys={[selectedSortOption]}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string
                      if (key) setSortOption(key as 'stars' | 'forks' | 'updated')
                    }}
                    placeholder="並び順を選択"
                    size="sm"
                  >
                    {SEARCH.SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* 昇順・降順 */}
                <div>
                  <label className="block text-sm font-medium mb-2">順序</label>
                  <Select
                    selectedKeys={[selectedOrderOption]}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string
                      if (key) setOrderOption(key as 'desc' | 'asc')
                    }}
                    placeholder="順序を選択"
                    size="sm"
                  >
                    {SEARCH.ORDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* クイック検索ボタン */}
              <div>
                <label className="block text-sm font-medium mb-2">人気の検索</label>
                <div className="flex flex-wrap gap-2">
                  {SEARCH.PLACEHOLDER_QUERIES.slice(0, 6).map((quickQuery) => (
                    <Button
                      key={quickQuery}
                      onClick={() => {
                        setInputValue(quickQuery)
                        setQuery(quickQuery)
                        resetResults()
                        onSearch?.(quickQuery)
                      }}
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {quickQuery}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}