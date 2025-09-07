import * as React from 'react';

export function GatedContent({ children, ..._props }: { children?: React.ReactNode } & Record<string, any>) {
  return <>{children}</>;
}

export function GatedBanner(_props: { type?: string; aiConfig?: any; userProfile?: any }) {
  return null;
}

export default GatedContent;
