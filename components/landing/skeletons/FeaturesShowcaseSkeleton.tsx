export function FeaturesShowcaseSkeleton() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header Skeleton */}
        <div className="text-center mb-16 space-y-4">
          <div className="h-10 w-64 bg-surface animate-pulse rounded-lg mx-auto" />
          <div className="h-6 w-96 bg-surface animate-pulse rounded-lg mx-auto" />
        </div>

        {/* Feature Items Skeleton */}
        <div className="space-y-24">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } gap-12 items-center`}
            >
              {/* Image Skeleton */}
              <div className="flex-1 w-full">
                <div className="aspect-video bg-surface animate-pulse rounded-xl" />
              </div>

              {/* Content Skeleton */}
              <div className="flex-1 space-y-6">
                <div className="h-8 w-3/4 bg-surface animate-pulse rounded-lg" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-surface animate-pulse rounded" />
                  <div className="h-4 w-full bg-surface animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-surface animate-pulse rounded" />
                </div>
                <div className="space-y-3 pt-4">
                  {[1, 2, 3].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-surface animate-pulse rounded-full" />
                      <div className="h-4 w-48 bg-surface animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
