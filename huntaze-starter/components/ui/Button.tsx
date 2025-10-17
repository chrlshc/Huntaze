import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-brand text-white hover:opacity-95",
  secondary: "bg-muted text-foreground hover:bg-muted/80",
  outline: "border border-border bg-transparent hover:bg-muted",
  ghost: "bg-transparent hover:bg-muted",
  destructive: "bg-destructive text-white hover:opacity-95"
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 px-3",
  md: "h-10 px-4",
  lg: "h-11 px-5 text-base"
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
});

export default Button;
