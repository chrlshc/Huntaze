'use client';

import React from 'react';

export interface DuotoneIconProps {
  name: string;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

// Icon path definitions
const iconPaths: Record<string, { primary: string; secondary: string }> = {
  home: {
    primary: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    secondary: 'M9 22V12h6v10',
  },
  analytics: {
    primary: 'M3 3v18h18',
    secondary: 'M18 17V9l-5 5-3-3-4 4',
  },
  content: {
    primary: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    secondary: 'M14 2v6h6M16 13H8M16 17H8M10 9H8',
  },
  messages: {
    primary: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    secondary: 'M8 10h8M8 14h4',
  },
  integrations: {
    primary: 'M12 2L2 7l10 5 10-5-10-5z',
    secondary: 'M2 17l10 5 10-5M2 12l10 5 10-5',
  },
  settings: {
    primary: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    secondary: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  },
};

export const DuotoneIcon: React.FC<DuotoneIconProps> = ({
  name,
  size = 24,
  primaryColor,
  secondaryColor,
  className = '',
}) => {
  const paths = iconPaths[name];

  if (!paths) {
    console.warn(`Icon "${name}" not found in icon library`);
    return null;
  }

  const style = {
    ...(primaryColor && { '--icon-primary': primaryColor }),
    ...(secondaryColor && { '--icon-secondary': secondaryColor }),
  } as React.CSSProperties;

  return (
    <svg
      className={`huntaze-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <path
        className="icon-primary"
        d={paths.primary}
        fill="var(--icon-primary, #9CA3AF)"
        strokeWidth="0"
      />
      <path
        className="icon-secondary"
        d={paths.secondary}
        fill="var(--icon-secondary, #9CA3AF)"
        opacity="0.4"
        strokeWidth="0"
      />
    </svg>
  );
};

export default DuotoneIcon;
