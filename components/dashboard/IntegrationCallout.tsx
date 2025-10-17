'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface IntegrationStep {
  title: string;
  description?: string;
  href?: string;
  external?: boolean;
}

interface IntegrationCalloutProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  steps: IntegrationStep[];
  className?: string;
  cta?: { label: string; href: string; external?: boolean };
}

export function IntegrationCallout({ icon, title, description, steps, className, cta }: IntegrationCalloutProps) {
  return (
    <Card className={cn('border-dashed border-violet-200 bg-violet-50/60 text-slate-800', className)}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          {icon ?? (
            <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {description && <p className="text-sm text-slate-600">{description}</p>}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-violet-200/70 bg-white/80 p-3">
          {steps.map((step, index) => (
            <div key={`${step.title}-${index}`} className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs text-violet-600">
                  {index + 1}
                </span>
                <span>{step.title}</span>
              </div>
              {step.description && <p className="pl-8 text-xs text-slate-500">{step.description}</p>}
              {step.href && (
                <div className="pl-8">
                  <Link
                    href={step.href}
                    target={step.external ? '_blank' : undefined}
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline"
                  >
                    {step.external ? <ExternalLink className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                    {step.external ? 'Ouvrir la documentation' : 'Ouvrir'}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {cta && (
          <div className="flex flex-wrap gap-2">
            <Link href={cta.href} target={cta.external ? '_blank' : undefined}>
              <Button variant="default" className="bg-violet-600 hover:bg-violet-500">
                {cta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IntegrationCallout;
