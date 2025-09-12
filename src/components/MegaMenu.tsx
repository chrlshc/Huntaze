"use client";
import React, { useEffect, useRef } from 'react';
import type { MenuGroup } from './nav.data';
import Link from 'next/link';

type MegaMenuProps = {
  label: string;
  groups: MenuGroup[];
  columns?: number; // 3 for Solutions, 4 for Resources
  align?: 'left' | 'center' | 'right';
  footerLinks?: { title: string; href: string }[];
  panelAlign?: 'container-left' | 'viewport-left' | 'viewport-stretch';
  panelGutter?: number; // px
};

export function MegaMenu({ label, groups, columns = 3, align = 'left', footerLinks, panelAlign = 'container-left', panelGutter = 24 }: MegaMenuProps) {
  const alignment = align === 'center' ? 'left-1/2 -translate-x-1/2' : align === 'right' ? 'right-0' : 'left-0';
  const closeParentDetails = (el: HTMLElement | null) => {
    const d = el?.closest('details') as HTMLDetailsElement | null;
    if (d && d.open) d.open = false;
  };
  const isCenter = align === 'center';
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Ensure only one mega menu open at a time
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (!detailsRef.current) return;
      if (ce.detail !== detailsRef.current && detailsRef.current.open) {
        detailsRef.current.open = false;
      }
    };
    document.addEventListener('megamenu:open', handler as EventListener);
    return () => document.removeEventListener('megamenu:open', handler as EventListener);
  }, []);


  return (
    <details ref={detailsRef} className="relative group" onToggle={(e: React.SyntheticEvent<HTMLDetailsElement>) => {
      const el = e.currentTarget as HTMLDetailsElement;
      if (el.open) {
        document.dispatchEvent(new CustomEvent('megamenu:open', { detail: el }));
      }
    }}>
      <summary
        className="cursor-pointer select-none text-[14px] font-normal text-[#9CA3AF] hover:text-white focus:outline-none flex items-center gap-1.5"
        aria-haspopup="menu"
      >
        <span>{label}</span>
        <svg
          className="h-3.5 w-3.5 text-[#9CA3AF] transition-transform duration-200 opacity-0 group-hover:opacity-100 group-open:rotate-180 group-open:text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </summary>

      {/* Backdrop (does not cover the header area) */}
      <div
        className="fixed left-0 right-0 bottom-0 top-[64px] z-40 hidden group-open:block"
        onClick={(e) => closeParentDetails(e.currentTarget)}
      />

      {/* Panel */}
      <div
        role="menu"
        className={`${(() => {
          if (panelAlign === 'viewport-left' || panelAlign === 'viewport-stretch') {
            return 'absolute';
          }
          // container-left (default)
          return isCenter ? 'absolute left-1/2 -translate-x-1/2' : `absolute ${alignment}`;
        })()} z-50 mt-3 transition-all duration-200 origin-top scale-95 opacity-0 group-open:opacity-100 group-open:scale-100 ${(label === 'Resources' || label === 'Solutions') ? 'group-open:translate-y-2' : ''}`}
        style={(() => {
          if (panelAlign === 'viewport-left') {
            return { left: `calc(50% - 50vw + ${panelGutter}px)` } as React.CSSProperties;
          }
          if (panelAlign === 'viewport-stretch') {
            return { left: `calc(50% - 50vw + ${panelGutter}px)`, right: `calc(50% - 50vw + ${panelGutter}px)` } as React.CSSProperties;
          }
          return undefined;
        })()}
      >
        <div
          className="rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-xl max-h-[calc(100vh-100px)] overflow-y-auto"
          style={panelAlign === 'container-left' ? undefined : ({ width: `min(1200px, calc(100vw - ${panelGutter * 2}px))` } as React.CSSProperties)}
        >
          <div className={`grid gap-y-8 gap-x-12 p-8 ${columns === 4 ? 'md:grid-cols-4' : columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {groups.map((group, idx) => {
              const sectionTitle = group.header?.title || group.heading || '';
              const lower = sectionTitle.toLowerCase();
              const isPopularTopics = lower.includes('popular');
              const isEssentialTools = lower.includes('essential');
              // Only enlarge items for Solutions mega menu; keep Resources consistent
              const enlargeItems = label === 'Solutions';
              return (
                <nav
                  key={idx}
                  className={`px-2 ${isPopularTopics ? 'md:col-start-2 md:col-span-2 md:-ml-8 lg:-ml-10' : ''} ${isEssentialTools ? 'md:col-start-4 pr-6 md:pr-10' : ''}`}
                  aria-label={sectionTitle}
                >
                  {sectionTitle && !isPopularTopics && (
                    <div className="mb-4 pb-2 border-b border-white/20 flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full ring-2 ring-white/30 bg-white/5 text-white">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3" /></svg>
                      </div>
                      <div className="text-[16px] font-semibold text-white">{sectionTitle}</div>
                    </div>
                  )}
                  <ul className={group.twoColumn ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'}>
                    {/* Centered section title between two columns for Popular topics */}
                    {isPopularTopics && (
                      <li className="col-span-2 hidden md:block">
                        <div className="px-2 py-1 mb-2 pb-2 border-b border-white/20">
                          <div className="flex items-center gap-3">
                            <div className="grid h-8 w-8 place-items-center rounded-full ring-2 ring-white/30 bg-white/5 text-white">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3" /></svg>
                            </div>
                            <div className="text-[16px] font-semibold text-white">{sectionTitle}</div>
                          </div>
                        </div>
                      </li>
                    )}
                    {group.items.map((item) => (
                      <li key={item.title}>
                        <Link
                          href={item.href}
                          className="block rounded-md px-2 py-2 transition focus:outline-none hover:text-white"
                          onClick={(e) => closeParentDetails(e.currentTarget)}
                        >
                          <div className={enlargeItems ? 'text-[15px] md:text-[16px] font-medium text-white' : 'text-[14px] font-normal text-white/90 hover:text-white'}>
                            {item.title}
                          </div>
                          {item.description && (
                            <p className={enlargeItems ? 'mt-0.5 text-[13px] md:text-[14px] text-white/60' : 'mt-0.5 text-[13px] text-white/60'}>
                              {item.description}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                {group.footer && (
                  <div className="mt-4">
                    <Link href={group.footer.href} className="inline-flex items-center text-xs font-medium text-white/80 hover:text-white" onClick={(e)=>closeParentDetails(e.currentTarget)}>
                      {group.footer.title}
                      <svg className="ml-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 10H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                )}
              </nav>
            )})}
          </div>
          {footerLinks && footerLinks.length > 0 && (
            <div className="border-t border-white/10 px-6 md:px-8 py-4 flex flex-wrap gap-4 justify-end">
              {footerLinks.map((f) => (
                <Link key={f.href} href={f.href} className="text-xs font-medium text-white/80 hover:text-white" onClick={(e)=>closeParentDetails(e.currentTarget)}>
                  {f.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

export default MegaMenu;
