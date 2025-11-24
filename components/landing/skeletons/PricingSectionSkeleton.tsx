export function PricingSectionSkeleton() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header Skeleton */}
        <div className="text-center mb-16 space-y-4">
          <div className="h-10 w-48 bg-surface animate-pulse rounded-lg mx-auto" />
          <div className="h-6 w-96 bg-surface animate-pulse rounded-lg mx-auto" />
        </div>

        {/* Pricing Cards Skeleton */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[1, 2, 3].map((plan) => (
            <div
              key={plan}
              className={`bg-surface border ${
                plan === 2 ? 'border-primary' : 'border-border'
              } rounded-xl p-8 space-y-6 relative`}
            >
              {/* Popular Badge Skeleton */}
              {plan === 2 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="h-6 w-24 bg-primary/20 animate-pulse rounded-full" />
                </div>
              )}

              {/* Plan Name Skeleton */}
              <div className="h-6 w-32 bg-background animate-pulse rounded" />

              {/* Price Skeleton */}
              <div className="space-y-2">
                <div className="h-12 w-40 bg-background animate-pulse rounded-lg" />
                <div className="h-4 w-48 bg-background animate-pulse rounded" />
              </div>

              {/* Features List Skeleton */}
              <div className="space-y-3 pt-4">
                {[1, 2, 3, 4, 5, 6].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-background animate-pulse rounded-full" />
                    <div className="h-4 w-full bg-background animate-pulse rounded" />
                  </div>
                ))}
              </div>

              {/* CTA Button Skeleton */}
              <div className="pt-6">
                <div className="h-12 w-full bg-background animate-pulse rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
