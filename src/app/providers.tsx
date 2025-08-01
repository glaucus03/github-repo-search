'use client'

import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <HeroUIProvider
        locale="ja-JP"
        skipFramerMotionAnimations={false}
      >
        {children}
      </HeroUIProvider>
    </NextThemesProvider>
  )
}