import React from 'react';

export function GatedContent({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) {
  return <>{children}</>;
}

export function GatedBanner(props?: any) {
  return null;
}

export default GatedContent;