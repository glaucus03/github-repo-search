export default function Loading() {
  return (
    <div className="search-container">
      <div className="text-center mb-8">
        <div className="h-10 bg-muted rounded-md animate-pulse mb-4"></div>
        <div className="h-6 bg-muted rounded-md max-w-2xl mx-auto animate-pulse"></div>
      </div>
      
      <div className="bg-card rounded-lg p-8">
        <div className="space-y-4">
          <div className="h-12 bg-muted rounded-md animate-pulse"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}