import type { PropsWithChildren, ReactNode } from "react";
import { Card } from '@/components/ui/card';

type AuthLayoutProps = PropsWithChildren<{
  title?: string;
  subtitle?: ReactNode;
}>;

export function AuthLayout({ title = "Huntaze", subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md space-y-6 rounded-2xl border border-gray-800 bg-gray-800/70 p-8 shadow-[0_0_0_1px_rgba(255, 255, 255, 0.12)]">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">Huntaze</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-100">{title}</h1>
          {subtitle ? <div className="mt-2 text-sm text-gray-400">{subtitle}</div> : null}
        </div>
        {children}
      </Card>
    </div>
  );
}
