import { test, expect } from '@playwright/test'

test.describe('検索機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ページが正しく読み込まれる', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/GitHub Repository Search/)
    
    // メインヘッダーの確認
    await expect(page.getByRole('heading', { name: 'GitHub Repository Search' })).toBeVisible()
    
    // 検索フォームの確認
    await expect(page.getByPlaceholder('リポジトリを検索...')).toBeVisible()
    await expect(page.getByRole('button', { name: '検索する' })).toBeVisible()
  })

  test('検索機能が正常に動作する', async ({ page }) => {
    // 検索クエリを入力
    const searchInput = page.getByPlaceholder('リポジトリを検索...')
    await searchInput.fill('react')
    
    // リアルタイム検索結果数が表示されるまで待機
    await expect(page.getByText(/「react」の検索結果は/)).toBeVisible({ timeout: 10000 })
    
    // 検索ボタンをクリック
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 検索結果が表示されるまで待機
    await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
    
    // 複数の結果が表示されることを確認
    const repositoryCards = page.locator('[data-testid="repository-card"]')
    await expect(repositoryCards.count()).resolves.toBeGreaterThan(0)
  })

  test('Enterキーで検索が実行される', async ({ page }) => {
    // 検索クエリを入力
    const searchInput = page.getByPlaceholder('リポジトリを検索...')
    await searchInput.fill('javascript')
    
    // Enterキーを押下
    await searchInput.press('Enter')
    
    // 検索結果が表示されるまで待機
    await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('検索中のローディング状態が表示される', async ({ page }) => {
    // 検索クエリを入力
    const searchInput = page.getByPlaceholder('リポジトリを検索...')
    await searchInput.fill('typescript')
    
    // 検索ボタンをクリック
    await page.getByRole('button', { name: '検索する' }).click()
    
    // ローディングスピナーが表示されることを確認
    await expect(page.getByText('検索中...')).toBeVisible()
  })

  test('検索結果のリポジトリカードに必要な情報が表示される', async ({ page }) => {
    // 検索を実行
    await page.getByPlaceholder('リポジトリを検索...').fill('vue')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 最初のリポジトリカードを確認
    const firstCard = page.locator('[data-testid="repository-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })
    
    // リポジトリ名が表示されることを確認
    await expect(firstCard.locator('h3')).toBeVisible()
    
    // オーナー名が表示されることを確認
    await expect(firstCard.locator('p').first()).toBeVisible()
    
    // スター数が表示されることを確認
    await expect(firstCard.getByText(/\d+/).first()).toBeVisible()
  })

  test('リポジトリカードクリックで詳細ページに遷移する', async ({ page }) => {
    // 検索を実行
    await page.getByPlaceholder('リポジトリを検索...').fill('next')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 最初のリポジトリカードをクリック
    const firstCard = page.locator('[data-testid="repository-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })
    
    await firstCard.click()
    
    // 詳細ページに遷移することを確認
    await expect(page).toHaveURL(/\/repository\/.*\/.*/)
    
    // 詳細ページの要素が表示されることを確認
    await expect(page.locator('h1')).toBeVisible()
  })

  test('ページネーションが正常に動作する', async ({ page }) => {
    // 多くの結果が期待される検索を実行
    await page.getByPlaceholder('リポジトリを検索...').fill('javascript')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 検索結果が表示されるまで待機
    await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
    
    // ページネーションが表示されることを確認
    const pagination = page.locator('[data-testid="pagination"]')
    await expect(pagination).toBeVisible()
    
    // 2ページ目のボタンがある場合はクリック
    const page2Button = page.getByRole('button', { name: '2' })
    if (await page2Button.isVisible()) {
      await page2Button.click()
      
      // ページが変更されることを確認（URLまたは表示内容の変化）
      await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('タイトルクリックで初期状態にリセットされる', async ({ page }) => {
    // 検索を実行
    await page.getByPlaceholder('リポジトリを検索...').fill('python')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 検索結果が表示されるまで待機
    await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
    
    // タイトルをクリック
    await page.getByRole('heading', { name: 'GitHub Repository Search' }).click()
    
    // 検索フォームがリセットされることを確認
    await expect(page.getByPlaceholder('リポジトリを検索...')).toHaveValue('')
    
    // 初期状態のメッセージが表示されることを確認
    await expect(page.getByText('検索を開始してください')).toBeVisible()
  })

  test('空の検索クエリで検索ボタンが無効になる', async ({ page }) => {
    // 検索ボタンが無効であることを確認
    const searchButton = page.getByRole('button', { name: '検索する' })
    await expect(searchButton).toBeDisabled()
    
    // 文字を入力すると有効になることを確認
    await page.getByPlaceholder('リポジトリを検索...').fill('test')
    await expect(searchButton).toBeEnabled()
    
    // 文字を削除すると無効になることを確認
    await page.getByPlaceholder('リポジトリを検索...').fill('')
    await expect(searchButton).toBeDisabled()
  })
})