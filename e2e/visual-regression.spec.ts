import { test, expect } from '@playwright/test'

test.describe('ビジュアルリグレッションテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ホームページの初期状態のスクリーンショット', async ({ page }) => {
    // ページが完全に読み込まれるまで待機
    await expect(page.getByRole('heading', { name: 'GitHub Repository Search' })).toBeVisible()
    await expect(page.getByPlaceholder('リポジトリを検索...')).toBeVisible()
    
    // スクリーンショットを撮影
    await expect(page).toHaveScreenshot('homepage-initial.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('検索フォームに入力中の状態のスクリーンショット', async ({ page }) => {
    // 検索クエリを入力
    const searchInput = page.getByPlaceholder('リポジトリを検索...')
    await searchInput.fill('react')
    
    // リアルタイム検索結果が表示されるまで待機
    await expect(page.getByText(/「react」の検索結果は/)).toBeVisible({ timeout: 10000 })
    
    // スクリーンショットを撮影
    await expect(page).toHaveScreenshot('search-form-with-live-results.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('検索結果表示状態のスクリーンショット', async ({ page }) => {
    // 検索を実行
    await page.getByPlaceholder('リポジトリを検索...').fill('javascript')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 検索結果が表示されるまで待機
    await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
    
    // ページネーションが表示されるまで待機
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
    
    // スクリーンショットを撮影
    await expect(page).toHaveScreenshot('search-results.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('検索中のローディング状態のスクリーンショット', async ({ page }) => {
    // ネットワークを遅延させる
    await page.route('/api/repositories/search*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      route.continue()
    })
    
    // 検索を実行
    const searchInput = page.getByPlaceholder('リポジトリを検索...')
    await searchInput.fill('vue')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // ローディング状態が表示されるまで待機
    await expect(page.getByText('検索中...')).toBeVisible()
    
    // スクリーンショットを撮影
    await expect(page).toHaveScreenshot('search-loading.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('検索結果なしの状態のスクリーンショット', async ({ page }) => {
    // 結果がない検索クエリを使用
    await page.getByPlaceholder('リポジトリを検索...').fill('nonexistentrepository12345')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 結果なしメッセージが表示されるまで待機
    await expect(page.getByText('検索結果が見つかりませんでした')).toBeVisible({ timeout: 10000 })
    
    // スクリーンショットを撮影
    await expect(page).toHaveScreenshot('no-search-results.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('リポジトリカードのホバー状態のスクリーンショット', async ({ page }) => {
    // 検索を実行
    await page.getByPlaceholder('リポジトリを検索...').fill('typescript')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 検索結果が表示されるまで待機
    const firstCard = page.locator('[data-testid="repository-card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })
    
    // カードにホバー
    await firstCard.hover()
    
    // ホバー効果が適用されるまで少し待機
    await page.waitForTimeout(300)
    
    // スクリーンショットを撮影
    await expect(page).toHaveScreenshot('repository-card-hover.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('ページネーション表示状態のスクリーンショット', async ({ page }) => {
    // 多くの結果が期待される検索を実行
    await page.getByPlaceholder('リポジトリを検索...').fill('react')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 検索結果とページネーションが表示されるまで待機
    await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
    
    // ページネーション部分にスクロール
    await page.locator('[data-testid="pagination"]').scrollIntoViewIfNeeded()
    
    // スクリーンショットを撮影（ページネーション部分のみ）
    await expect(page.locator('[data-testid="pagination"]')).toHaveScreenshot('pagination.png', {
      animations: 'disabled',
    })
  })

  test('モバイル表示でのスクリーンショット', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 })
    
    // ページを再読み込み
    await page.reload()
    
    // 要素が表示されるまで待機
    await expect(page.getByRole('heading', { name: 'GitHub Repository Search' })).toBeVisible()
    
    // スクリーンショットを撮影
    await expect(page).toHaveScreenshot('mobile-homepage.png', {
      fullPage: true,
      animations: 'disabled',
    })
    
    // モバイルで検索実行
    await page.getByPlaceholder('リポジトリを検索...').fill('nextjs')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 検索結果が表示されるまで待機
    await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
    
    // モバイル検索結果のスクリーンショット
    await expect(page).toHaveScreenshot('mobile-search-results.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('タブレット表示でのスクリーンショット', async ({ page }) => {
    // タブレットサイズに設定
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // ページを再読み込み
    await page.reload()
    
    // 要素が表示されるまで待機
    await expect(page.getByRole('heading', { name: 'GitHub Repository Search' })).toBeVisible()
    
    // 検索を実行
    await page.getByPlaceholder('リポジトリを検索...').fill('angular')
    await page.getByRole('button', { name: '検索する' }).click()
    
    // 検索結果が表示されるまで待機
    await expect(page.locator('[data-testid="repository-card"]').first()).toBeVisible({ timeout: 10000 })
    
    // スクリーンショットを撮影
    await expect(page).toHaveScreenshot('tablet-search-results.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})