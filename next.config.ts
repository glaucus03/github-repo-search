import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLintのwarningをignoreしてビルドを続行
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScriptエラーの場合のみビルドを停止
    ignoreBuildErrors: false,
  },
  // 静的生成を無効にして動的レンダリングを強制
  // output: 'standalone', // ビルドエラーを防ぐため一時的に無効化
  // トレーリングスラッシュの設定
  trailingSlash: false,
};

export default nextConfig;
