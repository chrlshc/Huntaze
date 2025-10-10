import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
