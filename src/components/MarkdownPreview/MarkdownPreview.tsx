'use client'

import React from 'react'
import MarkdownPreview from '@uiw/react-markdown-preview'
import rehypeRaw from 'rehype-raw'
import styles from './MarkdownPreview.module.css'

interface MarkdownPreviewProps {
  content: string
  className?: string
  repositoryInfo?: {
    owner: string
    name: string
    branch?: string
  }
}

/**
 * GitHub風のMarkdownプレビューコンポーネント
 */
const CustomMarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className = '',
  repositoryInfo,
}) => {
  // 文字エンコーディングを修正する関数
  const fixEncoding = (text: string): string => {
    try {
      // UTF-8として正しくデコードされていない場合の修正
      const bytes = new Uint8Array(text.split('').map(char => char.charCodeAt(0)))
      const decoder = new TextDecoder('utf-8', { fatal: false })
      const corrected = decoder.decode(bytes)
      
      if (corrected && !corrected.includes('�')) {
        return corrected
      }
    } catch (e) {
      // デコードに失敗した場合は元のテキストを使用
    }
    
    // 一般的なエンコーディングエラーのパターンを修正
    return text
      .replace(/ð\x9F\x9A\x80/g, '🚀')
      .replace(/ð\x9F\x8E\x89/g, '🎉')
      .replace(/ð\x9F\x94\x91/g, '🔑')
      .replace(/ð\x9F\x91\x80/g, '👀')
      .replace(/ð\x9F\x91\x8D/g, '👍')
      .replace(/ð\x9F\x92\xAF/g, '💯')
      .replace(/â\x9C\x85/g, '✅')
      .replace(/â\x9C\x93/g, '✓')
      .replace(/â\x9C\x96/g, '✖')
      .replace(/â\x9C\xA8/g, '✨')
      .replace(/â\x9A\xA1/g, '⚡')
      .replace(/â\x9A\xA0/g, '⚠')
      .replace(/â\xAD\x90/g, '⭐')
      .replace(/â\x9D\xA4/g, '❤')
      .replace(/â\x9D\x8C/g, '❌')
      .replace(/Ã¢â‚¬â„¢/g, "'")
      .replace(/Ã¢â‚¬Å"/g, '"')
      .replace(/Ã¢â‚¬\x9D/g, '"')
      .replace(/Ã¢â‚¬â€/g, '—')
      .replace(/Ã¢â‚¬â€œ/g, '–')
      .replace(/Ã¢Â€Â™/g, "'")
      .replace(/Ã¢Â€Âœ/g, '"')
      .replace(/Ã¢Â€Â\x9D/g, '"')
      .replace(/Ã¢Â€Â"/g, '—')
      .replace(/Ã‚Â/g, '')
      .replace(/Â/g, '')
      .replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => {
        try {
          return String.fromCharCode(parseInt(hex, 16))
        } catch {
          return match
        }
      })
  }

  // ダークモードの検出
  const [isDark, setIsDark] = React.useState(false)

  // コンテンツの前処理
  const processedContent = React.useMemo(() => {
    if (!content) return ''
    
    // 文字エンコーディングの修正
    let processed = fixEncoding(content)
    
    // HTMLコメントを除去
    processed = processed.replace(/<!--[\s\S]*?-->/g, '')
    
    // HTML実体参照をデコード
    processed = processed.replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#39;/g, "'")
                       .replace(/&nbsp;/g, ' ')
    
    // HTMLタグの問題を修正 - 特にp alignやimg srcなどの属性を含むHTMLを適切に処理
    // HTMLタグが文字化けしている場合の対処
    processed = processed.replace(/&lt;p align="center"&gt;/g, '<p align="center">')
                       .replace(/&lt;\/p&gt;/g, '</p>')
                       .replace(/&lt;a href="([^"]*)"&gt;/g, '<a href="$1">')
                       .replace(/&lt;\/a&gt;/g, '</a>')
                       .replace(/&lt;img ([^&]*?)&gt;/g, '<img $1>')
                       .replace(/&lt;img ([^&]*?)\/&gt;/g, '<img $1/>')
    
    // 相対パスの画像URLを絶対URLに変換（GitHubリポジトリ用）
    if (repositoryInfo) {
      const { owner, name, branch = 'main' } = repositoryInfo
      processed = processed.replace(
        /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g, 
        (match, before, src, after) => {
          // 相対パスの場合はGitHubのrawコンテンツURLに変換
          if (!src.startsWith('http') && !src.startsWith('data:')) {
            // GitHubリポジトリのrawコンテンツURL形式に変換
            const cleanSrc = src.replace(/^\.?\//, '')
            const newSrc = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${cleanSrc}`
            return `<img${before}src="${newSrc}"${after} style="max-width: 100%; height: auto; border-radius: 8px;">`
          }
          return `<img${before}src="${src}"${after} style="max-width: 100%; height: auto; border-radius: 8px;">`
        }
      )
    } else {
      // リポジトリ情報がない場合のフォールバック
      processed = processed.replace(
        /<img([^>]*?)src="([^"]*?)"([^>]*?)>/g,
        `<img$1src="$2"$3 style="max-width: 100%; height: auto; border-radius: 8px;">`
      )
    }
    
    // 連続する改行を整理
    processed = processed.replace(/\n{3,}/g, '\n\n')
    
    return processed.trim()
  }, [content, isDark])
  
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkDarkMode()
    
    // MutationObserverでダークモードの変更を監視
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [])

  return (
    <div className={`${styles.markdownWrapper} ${className}`} data-color-mode={isDark ? 'dark' : 'light'}>
      <MarkdownPreview
        source={processedContent}
        style={{
          padding: '0',
          backgroundColor: 'transparent',
          color: 'inherit',
        }}
        wrapperElement={{
          'data-color-mode': isDark ? 'dark' : 'light'
        }}
        rehypePlugins={[rehypeRaw]}
        components={{
          img: ({ src, alt, ...props }) => {
            // 画像のエラーハンドリングと適切な表示
            return (
              <img
                {...props}
                src={src}
                alt={alt || ''}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block',
                  margin: '16px auto',
                }}
                onError={(e) => {
                  // 画像読み込みエラー時の処理
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  console.warn('Failed to load image:', src)
                }}
              />
            )
          },
          p: ({ children, ...props }) => {
            // 中央揃えのp要素を適切に処理
            const align = (props as any)?.align
            if (align === 'center') {
              return (
                <div style={{ textAlign: 'center', margin: '16px 0' }}>
                  {children}
                </div>
              )
            }
            return <p {...props}>{children}</p>
          }
        }}
      />
    </div>
  )
}

export default CustomMarkdownPreview