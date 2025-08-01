import { test, expect } from '@playwright/test'

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/')
  
  // ページタイトルの確認
  await expect(page).toHaveTitle(/GitHub Repository Search/)
  
  // メインヘッダーの確認
  await expect(page.getByRole('heading', { name: 'GitHub Repository Search' })).toBeVisible()
  
  // 説明文の確認
  await expect(page.getByText('Discover amazing open source projects')).toBeVisible()
})