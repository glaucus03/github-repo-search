export default function Loading() {
  return (
    <div className="search-container">
      <div className="mb-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4"></div>
        <div className="h-9 w-80 bg-muted rounded animate-pulse"></div>
      </div>

      <div className="bg-card rounded-lg p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-muted rounded animate-pulse"
              ></div>
            ))}
          </div>

          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
