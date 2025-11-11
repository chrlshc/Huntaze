import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: number | string;
  height?: number | string;
  lines?: number;
}

function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    rounded: 'rounded-lg'
  };

  const style: React.CSSProperties = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height })
  };

  if (lines && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn("animate-pulse bg-muted", variantClasses[variant], className)}
            style={style}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("animate-pulse bg-muted", variantClasses[variant], className)}
      style={style}
      {...props}
    />
  )
}

// Export variants for compatibility
export const SkeletonCard = Skeleton;
export const SkeletonList = Skeleton;
export const SkeletonTable = Skeleton;

export { Skeleton }
