'use client';

import { ReactNode, CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PolarisPageHeaderProps {
  title: string;
  backUrl?: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  unsavedChanges?: boolean;
}

const headerContainerStyle: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 1)',
  borderRadius: '8px',
  boxShadow: '0px 4px 6px -2px rgba(26, 26, 26, 0.20)',
  border: '1px solid rgba(227, 227, 227, 1)',
};

const titleStyle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'rgba(48, 48, 48, 1)',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

const backLinkStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: 'rgba(97, 97, 97, 1)',
  textDecoration: 'none',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

const unsavedBadgeStyle: CSSProperties = {
  fontSize: '12px',
  color: 'rgba(97, 97, 97, 1)',
  backgroundColor: 'rgba(246, 246, 247, 1)',
  padding: '4px 8px',
  borderRadius: '4px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

export function PolarisPageHeader({
  title,
  backUrl,
  primaryAction,
  secondaryActions,
  unsavedChanges = false,
}: PolarisPageHeaderProps) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 40, marginBottom: '16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={headerContainerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {backUrl && (
                <>
                  <Link href={backUrl} style={backLinkStyle}>
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                    <span>Back</span>
                  </Link>
                  <div style={{ height: '16px', width: '1px', backgroundColor: 'rgba(227, 227, 227, 1)' }} />
                </>
              )}
              <h1 style={titleStyle}>{title}</h1>
              {unsavedChanges && (
                <span style={unsavedBadgeStyle}>Unsaved changes</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {secondaryActions}
              {primaryAction}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
