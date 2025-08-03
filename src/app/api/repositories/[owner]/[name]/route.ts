import { NextRequest, NextResponse } from "next/server";

import { AppError } from "@/lib/errorHandler";
import { githubApi } from "@/lib/github-api";

// リポジトリ詳細取得API Route - GET handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; name: string }> },
) {
  try {
    const { owner, name } = await params;

    // パラメータのバリデーション
    if (!owner || !name) {
      return NextResponse.json(
        { error: "リポジトリのオーナーと名前は必須です" },
        { status: 400 },
      );
    }

    // オプションでincludeパラメータを確認
    const searchParams = request.nextUrl.searchParams;
    const includeLanguages = searchParams.get("include_languages") === "true";
    const includeContributors =
      searchParams.get("include_contributors") === "true";
    const includeReadme = searchParams.get("include_readme") === "true";

    // 基本的なリポジトリ情報を取得
    const repository = await githubApi.getRepository(owner, name);

    // 追加情報を並行して取得
    const additionalDataPromises: Promise<unknown>[] = [];
    const additionalDataKeys: string[] = [];

    if (includeLanguages) {
      additionalDataPromises.push(
        githubApi.getRepositoryLanguages(owner, name),
      );
      additionalDataKeys.push("languages");
    }

    if (includeContributors) {
      additionalDataPromises.push(
        githubApi.getRepositoryContributors(owner, name),
      );
      additionalDataKeys.push("contributors");
    }

    if (includeReadme) {
      additionalDataPromises.push(githubApi.getRepositoryReadme(owner, name));
      additionalDataKeys.push("readme");
    }

    // 追加データを取得
    const additionalData = await Promise.allSettled(additionalDataPromises);

    // レスポンスオブジェクトを構築
    const response: Record<string, unknown> = { ...repository };

    // 追加データをレスポンスに含める
    additionalData.forEach((result, index) => {
      const key = additionalDataKeys[index];
      if (result.status === "fulfilled") {
        response[key] = result.value;
      } else {
        // エラーの場合はnullを設定
        response[key] = null;
        console.warn(`${key}の取得に失敗:`, result.reason);
      }
    });

    // レスポンスヘッダーにキャッシュ制御を追加
    const headers = new Headers();
    headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("リポジトリ詳細APIエラー:", error);

    // エラーレスポンスの処理
    if (error instanceof AppError) {
      // 404エラーの場合
      if (error.code === "GITHUB_NOT_FOUND") {
        return NextResponse.json(
          { error: "リポジトリが見つかりません" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          ...(error.details &&
          typeof error.details === "object" &&
          error.details !== null
            ? { details: error.details }
            : {}),
        },
        { status: error.statusCode || 500 },
      );
    }

    // 予期しないエラー
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
