"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <div>
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-3 text-sm text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-70",
          error ? "border-red-500" : "",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-sm text-red-400" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
});
