'use client'

// シンプルなナビゲーションコンポーネント
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Navbar, NavbarBrand, Button } from '@heroui/react'
import { useRouter } from 'next/navigation'

import { useSearchStore } from '@/store/searchStore'
import { useUIStore } from '@/store/uiStore'

export function Navigation() {
  const router = useRouter()
  const { resetSearch } = useSearchStore()
  const { resetToInitialState } = useUIStore()
  
  // ホームに戻る際に完全に初期状態にリセット
  const handleHomeClick = () => {
    // 検索ストアを完全リセット
    resetSearch()
    
    // UI状態を完全リセット
    resetToInitialState()
    
    // カスタムイベントを発行してページレベルでもリセット
    window.dispatchEvent(new CustomEvent('resetToInitialState'))
    
    // ホームページに遷移
    router.push('/')
  }

  return (
    <Navbar 
      className="border-b border-gray-700 bg-gray-900"
    >
      {/* ブランド - アイコンのみ */}
      <NavbarBrand>
        <Button
          variant="light"
          className="text-gray-300 hover:text-white transition-colors"
          onClick={handleHomeClick}
          aria-label="ホームに戻る（初期状態にリセット）"
        >
          <MagnifyingGlassIcon className="w-6 h-6" />
        </Button>
      </NavbarBrand>
    </Navbar>
  )
}