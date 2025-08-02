'use client'

// シンプルなナビゲーションコンポーネント
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Navbar, NavbarBrand, Button } from '@heroui/react'
import { useRouter } from 'next/navigation'

export function Navigation() {
  const router = useRouter()
  
  // ホームに戻る際に初期状態にリセット
  const handleHomeClick = () => {
    // カスタムイベントを発行してページをリセット
    window.dispatchEvent(new CustomEvent('resetToInitialState'))
    router.push('/')
  }

  return (
    <Navbar 
      className="border-b border-gray-700 bg-gray-900"
      maxWidth="full"
      height="4rem"
    >
      {/* ブランド - 虫眼鏡アイコン */}
      <NavbarBrand>
        <Button
          variant="light"
          isIconOnly
          className="text-gray-300"
          onClick={handleHomeClick}
          aria-label="ホームに戻る（初期状態にリセット）"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </Button>
      </NavbarBrand>
    </Navbar>
  )
}