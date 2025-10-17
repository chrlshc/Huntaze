"use client"

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[global-error]', _error)
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-md space-y-3 text-center">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm transition hover:bg-muted"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm transition hover:bg-muted"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
