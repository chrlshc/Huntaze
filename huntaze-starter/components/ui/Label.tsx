import { cn } from "@/lib/utils";
import { LabelHTMLAttributes } from "react";

export default function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}
