export function SocialProofSkeleton() {
  return (
    <section className="py-24 bg-surface/50">
      <div className="container mx-auto px-4">
        {/* Stats Section Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          {[1, 2, 3, 4].map((stat) => (
            <div key={stat} className="text-center space-y-2">
              <div className="h-12 w-32 bg-surface animate-pulse rounded-lg mx-auto" />
              <div className="h-4 w-24 bg-surface animate-pulse rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Testimonials Section Skeleton */}
        <div className="space-y-8">
          <div className="h-8 w-48 bg-surface animate-pulse rounded-lg mx-auto" />
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[1, 2, 3].map((testimonial) => (
              <div
                key={testimonial}
                className="bg-background border border-border rounded-xl p-6 space-y-4"
              >
                {/* Rating Stars Skeleton */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="w-5 h-5 bg-surface animate-pulse rounded"
                    />
                  ))}
                </div>

                {/* Content Skeleton */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-surface animate-pulse rounded" />
                  <div className="h-4 w-full bg-surface animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-surface animate-pulse rounded" />
                </div>

                {/* Author Skeleton */}
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-12 h-12 bg-surface animate-pulse rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-surface animate-pulse rounded" />
                    <div className="h-3 w-32 bg-surface animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
