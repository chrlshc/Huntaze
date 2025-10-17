import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant = "default" | "outline" | "success" | "warning" | "info";

export default function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    default: "bg-brand/10 text-brand ring-1 ring-inset ring-brand/20",
    outline: "ring-1 ring-inset ring-border text-foreground",
    success: "bg-green-500/10 text-green-600 ring-1 ring-inset ring-green-500/20",
    warning: "bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20",
    info: "bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20"
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles[variant], className)} {...props} />;
}
