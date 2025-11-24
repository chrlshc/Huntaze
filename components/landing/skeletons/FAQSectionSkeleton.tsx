export function FAQSectionSkeleton() {
  return (
    <section className="py-24 bg-surface/50">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Section Header Skeleton */}
        <div className="text-center mb-16 space-y-4">
          <div className="h-10 w-64 bg-surface animate-pulse rounded-lg mx-auto" />
          <div className="h-6 w-96 bg-surface animate-pulse rounded-lg mx-auto" />
        </div>

        {/* FAQ Items Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((faq) => (
            <div
              key={faq}
              className="bg-background border border-border rounded-xl p-6 space-y-3"
            >
              {/* Question Skeleton */}
              <div className="flex items-center justify-between">
                <div className="h-6 w-3/4 bg-surface animate-pulse rounded" />
                <div className="w-6 h-6 bg-surface animate-pulse rounded" />
              </div>

              {/* Answer Skeleton (collapsed state) */}
              <div className="space-y-2 opacity-50">
                <div className="h-4 w-full bg-surface animate-pulse rounded" />
                <div className="h-4 w-full bg-surface animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-surface animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
