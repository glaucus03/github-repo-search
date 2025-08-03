"use client";

// フッターコンポーネント
import {
  HeartIcon,
  CodeBracketIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { Link, Divider } from "@heroui/react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "プロジェクト",
      links: [
        { label: "GitHub", href: "https://github.com" },
        { label: "ドキュメント", href: "#" },
        { label: "API", href: "https://docs.github.com/rest" },
      ],
    },
    {
      title: "リソース",
      links: [
        { label: "Next.js", href: "https://nextjs.org" },
        { label: "HeroUI", href: "https://heroui.com" },
        { label: "Tailwind CSS", href: "https://tailwindcss.com" },
      ],
    },
    {
      title: "コミュニティ",
      links: [
        { label: "Issues", href: "#" },
        { label: "Discussions", href: "#" },
        { label: "Contributing", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-default-50 border-t border-divider mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* メインフッターコンテンツ */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* ブランドセクション */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <CodeBracketIcon className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold">GitHub Search</span>
              </div>
              <p className="text-sm text-default-600 mb-4">
                GitHubリポジトリを効率的に検索し、お気に入りのプロジェクトを見つけるためのモダンなWebアプリケーション
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="#"
                  isExternal
                  className="text-sm text-default-500 hover:text-primary transition-colors"
                >
                  <StarIcon className="w-4 h-4 inline mr-1" />
                  Star on GitHub
                </Link>
              </div>
            </div>

            {/* リンクセクション */}
            {footerLinks.map((section) => (
              <div key={section.title} className="col-span-1">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        isExternal={link.href.startsWith("http")}
                        className="text-sm text-default-600 hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* フッター下部 */}
        <div className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1 text-sm text-default-500">
              <span>© {currentYear} GitHub Search.</span>
              <span>Made with</span>
              <HeartIcon className="w-4 h-4 text-red-500" />
              <span>using Next.js</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="#"
                className="text-sm text-default-500 hover:text-primary transition-colors"
              >
                プライバシーポリシー
              </Link>
              <Link
                href="#"
                className="text-sm text-default-500 hover:text-primary transition-colors"
              >
                利用規約
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
