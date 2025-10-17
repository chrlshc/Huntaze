import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("h-px w-full bg-border", className)} {...props} />;
}
