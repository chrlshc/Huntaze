'use client';

import * as React from "react";

export const Popover = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const PopoverTrigger = ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>;

export const PopoverContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className ?? ''}>{children}</div>
);

PopoverContent.displayName = "PopoverContent";
