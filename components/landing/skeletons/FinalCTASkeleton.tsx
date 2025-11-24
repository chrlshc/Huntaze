export function FinalCTASkeleton() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Title Skeleton */}
          <div className="h-12 w-3/4 bg-surface animate-pulse rounded-lg mx-auto" />

          {/* Subtitle Skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-full bg-surface animate-pulse rounded mx-auto" />
            <div className="h-6 w-2/3 bg-surface animate-pulse rounded mx-auto" />
          </div>

          {/* CTA Buttons Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <div className="h-14 w-48 bg-surface animate-pulse rounded-lg" />
            <div className="h-14 w-48 bg-surface animate-pulse rounded-lg" />
          </div>

          {/* Optional decorative elements */}
          <div className="flex justify-center gap-8 pt-12 opacity-50">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="w-12 h-12 bg-surface animate-pulse rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
