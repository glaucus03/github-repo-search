import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errorHandler'
import { githubApi } from '@/lib/github-api'
import { GitHubSearchQuery } from '@/types/github'

// 検索API Route - GET handler
export async function GET(request: NextRequest) {
  try {
    // URLパラメータを取得
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')
    const sort = searchParams.get('sort') as 'stars' | 'forks' | 'updated' | undefined
    const order = searchParams.get('order') as 'desc' | 'asc' | undefined
    const per_page = searchParams.get('per_page')
    const page = searchParams.get('page')

    // クエリパラメータのバリデーション
    if (!q) {
      return NextResponse.json(
        { error: '検索クエリ(q)は必須です' },
        { status: 400 }
      )
    }

    // 検索クエリの構築
    const query: GitHubSearchQuery = {
      q,
      sort,
      order,
      per_page: per_page ? parseInt(per_page, 10) : 30,
      page: page ? parseInt(page, 10) : 1,
    }

    // per_pageの範囲チェック
    if (query.per_page !== undefined && (query.per_page < 1 || query.per_page > 100)) {
      return NextResponse.json(
        { error: 'per_pageは1から100の間で指定してください' },
        { status: 400 }
      )
    }

    // GitHub APIを呼び出し
    const result = await githubApi.searchRepositories(query)

    // レスポンスヘッダーにキャッシュ制御を追加
    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return NextResponse.json(result, { headers })
  } catch (error) {
    console.error('検索APIエラー:', error)

    // エラーレスポンスの処理
    if (error instanceof AppError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          ...(error.details && { details: error.details })
        },
        { status: error.statusCode || 500 }
      )
    }

    // 予期しないエラー
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}