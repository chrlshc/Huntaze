import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Export variants for compatibility
export const SkeletonCard = Skeleton;
export const SkeletonList = Skeleton;
export const SkeletonTable = Skeleton;

export { Skeleton }
