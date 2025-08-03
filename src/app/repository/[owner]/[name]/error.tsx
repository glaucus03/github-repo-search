"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Repository detail error:", error);
  }, [error]);

  return (
    <div className="search-container">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          Repository not found
        </h2>
        <p className="text-muted-foreground mb-6">
          The repository you&apos;re looking for doesn&apos;t exist or is not
          accessible.
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Back to search
          </Link>
        </div>
      </div>
    </div>
  );
}
