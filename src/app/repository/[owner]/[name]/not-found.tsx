import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="search-container">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Repository Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The repository you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Back to search
        </Link>
      </div>
    </div>
  )
}