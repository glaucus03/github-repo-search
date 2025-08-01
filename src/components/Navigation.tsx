'use client'

// シンプルなナビゲーションコンポーネント
import {
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  BookmarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Divider,
} from '@heroui/react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useUIStore } from '@/store/uiStore'

export function Navigation() {
  const router = useRouter()
  const { favoriteCount, loadFavorites } = useUIStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // ホームに戻る際に初期状態にリセット
  const handleHomeClick = () => {
    router.push('/?reset=true')
  }

  useEffect(() => {
    setMounted(true)
    loadFavorites() // お気に入り数を読み込み
  }, [loadFavorites])

  // テーマ変更ハンドラー
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }


  // テーマ表示名の取得
  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'ライト'
      case 'dark':
        return 'ダーク'
      default:
        return 'ダーク'
    }
  }

  return (
    <Navbar 
      className="border-b border-gray-300 dark:border-gray-700"
      maxWidth="full"
      height="4rem"
    >
      {/* ブランド - 虫眼鏡アイコン */}
      <NavbarBrand>
        <Button
          variant="light"
          isIconOnly
          className="text-black dark:text-gray-300"
          onClick={handleHomeClick}
          aria-label="ホームに戻る（初期状態にリセット）"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </Button>
      </NavbarBrand>

      {/* 右側のコンテンツ */}
      <NavbarContent justify="end">
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant="light"
                isIconOnly
                className="text-black dark:text-gray-300"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="設定メニュー" className="w-64">
              {/* テーマ設定 */}
              <DropdownItem
                key="theme-header"
                className="h-14 gap-2"
                textValue="テーマ設定"
              >
                <div className="flex flex-col">
                  <span className="text-small font-semibold">テーマ設定</span>
                  <span className="text-tiny text-default-400">
                    現在: {getThemeLabel()}
                  </span>
                </div>
              </DropdownItem>
              
              <DropdownItem
                key="theme-light"
                startContent={<SunIcon className="w-4 h-4" />}
                onClick={() => handleThemeChange('light')}
                className={theme === 'light' ? 'bg-primary-50 dark:bg-primary-900' : ''}
              >
                ライトモード
              </DropdownItem>
              
              <DropdownItem
                key="theme-dark"
                startContent={<MoonIcon className="w-4 h-4" />}
                onClick={() => handleThemeChange('dark')}
                className={theme === 'dark' ? 'bg-primary-50 dark:bg-primary-900' : ''}
              >
                ダークモード
              </DropdownItem>
              

              {/* 区切り線 */}
              <DropdownItem key="divider" className="p-0">
                <Divider />
              </DropdownItem>

              {/* ナビゲーション */}
              <DropdownItem
                key="favorites"
                startContent={<BookmarkIcon className="w-4 h-4" />}
                onClick={() => router.push('/favorites')}
                endContent={
                  favoriteCount > 0 ? (
                    <div className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {favoriteCount}
                    </div>
                  ) : null
                }
              >
                お気に入り
              </DropdownItem>
              
              <DropdownItem
                key="history"
                startContent={<ClockIcon className="w-4 h-4" />}
                onClick={() => router.push('/history')}
              >
                検索履歴
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}