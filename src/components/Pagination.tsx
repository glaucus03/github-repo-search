"use client";

// ページネーションコンポーネント
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
  className,
}: PaginationProps) {
  // 表示範囲を計算
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // 表示するページ番号の範囲を計算
  const getVisiblePages = () => {
    const delta = 2; // 現在のページから前後何ページ表示するか
    const pages: (number | string)[] = [];

    // 最初のページは常に表示
    if (currentPage > delta + 2) {
      pages.push(1);
      if (currentPage > delta + 3) {
        pages.push("...");
      }
    }

    // 現在のページ周辺
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      pages.push(i);
    }

    // 最後のページは常に表示
    if (currentPage < totalPages - delta - 1) {
      if (currentPage < totalPages - delta - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* 結果の情報 */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {totalItems.toLocaleString()}件中 {startItem.toLocaleString()} -{" "}
        {endItem.toLocaleString()} 件を表示
      </div>

      {/* ページネーション */}
      <div className="flex items-center gap-2">
        {/* 前のページボタン */}
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          isDisabled={currentPage <= 1 || loading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>

        {/* ページ番号 */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <Button
                  variant={page === currentPage ? "solid" : "flat"}
                  color={page === currentPage ? "primary" : "default"}
                  size="sm"
                  isDisabled={loading}
                  className={cn(
                    "min-w-[40px]",
                    page === currentPage && "font-semibold",
                  )}
                  onClick={() => typeof page === "number" && onPageChange(page)}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 次のページボタン */}
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          isDisabled={currentPage >= totalPages || loading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* ページ情報 */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        ページ {currentPage} / {totalPages}
      </div>
    </div>
  );
}
