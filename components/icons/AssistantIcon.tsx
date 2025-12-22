import React from 'react';

export interface AssistantIconProps {
  size?: number;
  className?: string;
}

export function AssistantIcon({ size = 24, className = '' }: AssistantIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      role="img" 
      aria-label="Majordome"
      width={size}
      height={size}
      className={className}
    >
      <circle cx="256" cy="256" r="240" fill="#000"/>

      {/* Torso with sharper, squarer shoulders (no big curves) */}
      <path fill="#fff" d="
        M124 432
        V378
        L170 332
        L198 312
        Q208 304 220 304
        H292
        Q304 304 314 312
        L342 332
        L388 378
        V432
        H124 Z"/>

      {/* Neck */}
      <path fill="#fff" d="
        M232 270
        H280
        Q294 270 294 284
        V318
        Q294 336 276 338
        H236
        Q218 336 218 318
        V284
        Q218 270 232 270 Z"/>

      {/* Head (jaw/chin shape, not a circle) */}
      <path fill="#fff" d="
        M256 108
        C214 108 184 140 176 176
        C170 206 178 236 198 258
        L222 278
        Q256 302 290 278
        L314 258
        C334 236 342 206 336 176
        C328 140 298 108 256 108 Z"/>

      {/* Hair */}
      <path fill="#000" d="
        M184 172
        C194 132 226 112 256 112
        C294 112 324 136 332 172
        C316 160 302 156 286 156
        C268 156 252 170 230 176
        C210 182 196 180 184 172 Z"/>

      {/* Pince-nez */}
      <g fill="#000">
        <circle cx="232" cy="198" r="18"/>
        <circle cx="280" cy="198" r="18"/>
        <rect x="246" y="194" width="20" height="8" rx="4"/>
        <rect x="252" y="202" width="8" height="18" rx="4"/>
        {/* ring cutouts */}
        <circle cx="232" cy="198" r="11" fill="#fff"/>
        <circle cx="280" cy="198" r="11" fill="#fff"/>
      </g>

      {/* Lapels */}
      <g fill="#000">
        <path d="M198 312 L256 362 L228 396 L186 350 Z"/>
        <path d="M314 312 L256 362 L284 396 L326 350 Z"/>
      </g>

      {/* Tie */}
      <g fill="#000">
        <path d="M256 330 L242 348 L256 366 L270 348 Z"/>
        <path d="M256 366 L232 446 L256 472 L280 446 Z"/>
      </g>
    </svg>
  );
}
