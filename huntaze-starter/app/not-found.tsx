export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">The page you’re looking for doesn’t exist.</p>
        <a href="/" className="inline-flex mt-2 h-9 items-center rounded-md border px-3 text-sm transition hover:bg-muted">Go home</a>
      </div>
    </div>
  )
}

