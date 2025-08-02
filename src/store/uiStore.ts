// UI状態管理用のZustandストア
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { FavoritesStorage } from '@/lib/storage'
import type { UIState } from '@/types'
import type { GitHubRepository } from '@/types/github'

interface UIStore extends UIState {
  // テーマ関連
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
  
  // 検索フォーム関連
  toggleSearchForm: () => void
  expandSearchForm: () => void
  collapseSearchForm: () => void
  
  // ソート・フィルター関連
  setSortOption: (sort: 'stars' | 'forks' | 'updated' | 'best-match') => void
  setOrderOption: (order: 'desc' | 'asc') => void
  toggleOrder: () => void
  
  // モーダル・オーバーレイ関連
  showRepositoryModal: boolean
  selectedRepositoryId: string | null
  setSelectedRepository: (id: string | null) => void
  openRepositoryModal: (id: string) => void
  closeRepositoryModal: () => void
  
  // サイドバー関連（将来の拡張用）
  sidebarOpen: boolean
  toggleSidebar: () => void
  
  // 検索結果表示設定
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  toggleViewMode: () => void
  
  // 無限スクロール関連
  autoLoadMore: boolean
  setAutoLoadMore: (enabled: boolean) => void
  
  // 通知・トースト関連
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title?: string
    message: string
    duration?: number
    actions?: Array<{
      label: string
      handler: () => void
    }>
  }>
  addNotification: (notification: Omit<UIStore['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  clearAllNotifications: () => void
  resetToInitialState: () => void
  
  // お気に入り関連
  favorites: GitHubRepository[]
  favoriteCount: number
  addToFavorites: (repository: GitHubRepository) => void
  removeFromFavorites: (repositoryId: number) => void
  clearAllFavorites: () => void
  isFavorite: (repositoryId: number) => boolean
  loadFavorites: () => void
}

const initialState: UIState = {
  theme: 'system',
  isSearchFormExpanded: false,
  selectedSortOption: 'best-match',
  selectedOrderOption: 'desc',
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, _get) => ({
        ...initialState,
        
        // モーダル・オーバーレイの初期状態
        showRepositoryModal: false,
        selectedRepositoryId: null,
        
        // サイドバーの初期状態
        sidebarOpen: false,
        
        // 表示設定の初期状態
        viewMode: 'grid',
        autoLoadMore: true,
        
        // 通知の初期状態
        notifications: [],
        
        // お気に入りの初期状態
        favorites: [],
        favoriteCount: 0,

        // テーマ関連
        setTheme: (theme) =>
          set({ theme }, false, 'ui/setTheme'),

        toggleTheme: () =>
          set(
            (state) => ({
              theme: state.theme === 'light' ? 'dark' : 'light',
            }),
            false,
            'ui/toggleTheme'
          ),

        // 検索フォーム関連
        toggleSearchForm: () =>
          set(
            (state) => ({
              isSearchFormExpanded: !state.isSearchFormExpanded,
            }),
            false,
            'ui/toggleSearchForm'
          ),

        expandSearchForm: () =>
          set({ isSearchFormExpanded: true }, false, 'ui/expandSearchForm'),

        collapseSearchForm: () =>
          set({ isSearchFormExpanded: false }, false, 'ui/collapseSearchForm'),

        // ソート・フィルター関連
        setSortOption: (sort) =>
          set({ selectedSortOption: sort }, false, 'ui/setSortOption'),

        setOrderOption: (order) =>
          set({ selectedOrderOption: order }, false, 'ui/setOrderOption'),

        toggleOrder: () =>
          set(
            (state) => ({
              selectedOrderOption: state.selectedOrderOption === 'desc' ? 'asc' : 'desc',
            }),
            false,
            'ui/toggleOrder'
          ),

        // モーダル・オーバーレイ関連
        setSelectedRepository: (id) =>
          set({ selectedRepositoryId: id }, false, 'ui/setSelectedRepository'),

        openRepositoryModal: (id) =>
          set(
            {
              selectedRepositoryId: id,
              showRepositoryModal: true,
            },
            false,
            'ui/openRepositoryModal'
          ),

        closeRepositoryModal: () =>
          set(
            {
              showRepositoryModal: false,
              selectedRepositoryId: null,
            },
            false,
            'ui/closeRepositoryModal'
          ),

        // サイドバー関連
        toggleSidebar: () =>
          set(
            (state) => ({ sidebarOpen: !state.sidebarOpen }),
            false,
            'ui/toggleSidebar'
          ),

        // 表示設定関連
        setViewMode: (mode) =>
          set({ viewMode: mode }, false, 'ui/setViewMode'),

        toggleViewMode: () =>
          set(
            (state) => ({
              viewMode: state.viewMode === 'grid' ? 'list' : 'grid',
            }),
            false,
            'ui/toggleViewMode'
          ),

        setAutoLoadMore: (enabled) =>
          set({ autoLoadMore: enabled }, false, 'ui/setAutoLoadMore'),

        // 通知関連
        addNotification: (notification) =>
          set(
            (state) => {
              const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              const duration = notification.duration || 3000 // デフォルト3秒
              const newNotification = { ...notification, id, duration }
              
              // 自動削除タイマーを設定
              setTimeout(() => {
                const currentState = _get()
                if (currentState.notifications.some(n => n.id === id)) {
                  set(
                    (state) => ({
                      notifications: state.notifications.filter((n) => n.id !== id),
                    }),
                    false,
                    'ui/autoRemoveNotification'
                  )
                }
              }, duration)
              
              return {
                notifications: [...state.notifications, newNotification],
              }
            },
            false,
            'ui/addNotification'
          ),

        removeNotification: (id) =>
          set(
            (state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }),
            false,
            'ui/removeNotification'
          ),

        clearNotifications: () =>
          set({ notifications: [] }, false, 'ui/clearNotifications'),

        // 完全リセット機能（ナビゲーション用）
        clearAllNotifications: () =>
          set({ notifications: [] }, false, 'ui/clearAllNotifications'),

        resetToInitialState: () =>
          set(
            {
              ...initialState,
              showRepositoryModal: false,
              selectedRepositoryId: null,
              sidebarOpen: false,
              viewMode: 'grid',
              autoLoadMore: true,
              notifications: [],
            },
            false,
            'ui/resetToInitialState'
          ),

        // お気に入り関連
        loadFavorites: () =>
          set(
            () => {
              const favorites = FavoritesStorage.getFavorites()
              return {
                favorites,
                favoriteCount: favorites.length,
              }
            },
            false,
            'ui/loadFavorites'
          ),

        addToFavorites: (repository) =>
          set(
            (state) => {
              const success = FavoritesStorage.addToFavorites(repository)
              if (success) {
                const newFavorites = [repository, ...state.favorites]
                return {
                  favorites: newFavorites,
                  favoriteCount: newFavorites.length,
                }
              }
              return state
            },
            false,
            'ui/addToFavorites'
          ),

        removeFromFavorites: (repositoryId) =>
          set(
            (state) => {
              const success = FavoritesStorage.removeFromFavorites(repositoryId)
              if (success) {
                const newFavorites = state.favorites.filter(repo => repo.id !== repositoryId)
                return {
                  favorites: newFavorites,
                  favoriteCount: newFavorites.length,
                }
              }
              return state
            },
            false,
            'ui/removeFromFavorites'
          ),

        clearAllFavorites: () =>
          set(
            () => {
              FavoritesStorage.clearFavorites()
              return {
                favorites: [],
                favoriteCount: 0,
              }
            },
            false,
            'ui/clearAllFavorites'
          ),

        isFavorite: (repositoryId) => {
          const state = _get()
          return state.favorites.some(repo => repo.id === repositoryId)
        },
      }),
      {
        name: 'ui-store',
        // 永続化から除外する項目
        partialize: (state) => ({
          theme: state.theme,
          viewMode: state.viewMode,
          autoLoadMore: state.autoLoadMore,
          selectedSortOption: state.selectedSortOption,
          selectedOrderOption: state.selectedOrderOption,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
)

// セレクター関数
export const selectTheme = (state: UIStore) => state.theme
export const selectSearchFormState = (state: UIStore) => state.isSearchFormExpanded
export const selectSortOptions = (state: UIStore) => ({
  sort: state.selectedSortOption,
  order: state.selectedOrderOption,
})
export const selectViewMode = (state: UIStore) => state.viewMode
export const selectNotifications = (state: UIStore) => state.notifications
export const selectModalState = (state: UIStore) => ({
  isOpen: state.showRepositoryModal,
  selectedId: state.selectedRepositoryId,
})