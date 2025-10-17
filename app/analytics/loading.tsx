export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="h-7 w-48 mb-6 rounded bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[0,1,2].map(i => (
          <div key={i} className="rounded-lg border p-4">
            <div className="h-4 w-24 mb-2 rounded bg-gray-100 animate-pulse" />
            <div className="h-7 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-5 w-56 mb-3 rounded bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0,1,2].map(i => (
          <div key={i} className="rounded-lg border p-4">
            <div className="h-4 w-28 mb-3 rounded bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-40 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-36 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-32 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
