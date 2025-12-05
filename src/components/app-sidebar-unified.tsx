"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Bot
} from "lucide-react";
import { SafeBadge } from "@/components/hydration/SafeBadge";
import { useSSE } from "@/hooks/useSSE";
import { useSSECounter } from "@/src/hooks/useSSECounter";
import { AnimatePresence, motion } from "framer-motion";
import "./nav-styles.css";
import { Button } from "@/components/ui/button";

// Import configuration from separate file for testability
import { 
  SIDEBAR_SECTIONS, 
  APP_PREFIXES,
  isRouteActive,
  isSectionActive,
  type SidebarSection,
  type SidebarItem
} from "./sidebar-config";

// Re-export for backwards compatibility
export { SIDEBAR_SECTIONS, APP_PREFIXES };

// Expandable Section Component
function SidebarSectionItem({ 
  section, 
  pathname, 
  isExpanded, 
  onToggle,
  onNavigate
}: { 
  section: SidebarSection; 
  pathname: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const Icon = section.icon;
  const isActive = isSectionActive(pathname, section);
  const hasItems = section.items && section.items.length > 0;

  // For sections with direct href (no sub-items)
  if (section.href && !hasItems) {
    return (
      <Link href={section.href} onClick={onNavigate}>
        <div
          className={`nav-item ${isActive ? "active" : ""}`}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon aria-hidden className="nav-item-icon" />
          <span className="nav-item-label">{section.label}</span>
        </div>
      </Link>
    );
  }

  // For sections with sub-items
  return (
    <div className="nav-section-expandable">
      <button
        onClick={onToggle}
        className={`nav-item nav-item-expandable ${isActive ? "active-section" : ""}`}
        aria-expanded={isExpanded}
      >
        <Icon aria-hidden className="nav-item-icon" />
        <span className="nav-item-label">{section.label}</span>
        {hasItems && (
          <span className="nav-item-chevron">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
      </button>
      
      <AnimatePresence initial={false}>
        {isExpanded && hasItems && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="nav-subitems"
          >
            {section.items!.map((item) => (
              <SidebarSubItem 
                key={item.href} 
                item={item} 
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-item Component with badge support
function SidebarSubItem({ 
  item, 
  pathname,
  onNavigate
}: { 
  item: SidebarItem; 
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const isActive = isRouteActive(pathname, item.href);
  const ItemIcon = item.icon;
  
  // Get badge count from SSE if configured
  const badgeCount = item.badge?.url
    ? useSSECounter({
        url: item.badge.type === "count" ? `${item.badge.url}?sse=1` : item.badge.url,
        eventName: item.badge.type === "count" ? "unread" : "alert",
      })
    : item.badge?.value || 0;

  return (
    <Link href={item.href} onClick={onNavigate}>
      <div
        className={`nav-subitem ${isActive ? "active" : ""}`}
        aria-current={isActive ? "page" : undefined}
      >
        {ItemIcon && <ItemIcon aria-hidden className="nav-subitem-icon" />}
        <span className="nav-subitem-label">{item.label}</span>
        {item.isNew && (
          <span className="nav-badge-new">New</span>
        )}
        {item.badge && badgeCount > 0 && (
          <SafeBadge
            count={badgeCount}
            type={item.badge.type === "count" ? "unread" : "alert"}
            maxCount={99}
          />
        )}
      </div>
    </Link>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const isApp = useMemo(() => APP_PREFIXES.some((p) => pathname?.startsWith(p)), [pathname]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const drawerRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

  // Enable SSE for real-time updates
  useSSE(true);

  // Auto-expand active section on mount and route change
  useEffect(() => {
    if (!pathname) return;
    
    const activeSection = SIDEBAR_SECTIONS.find(section => isSectionActive(pathname, section));
    if (activeSection && activeSection.items) {
      setExpandedSections(prev => new Set([...prev, activeSection.id]));
    }
  }, [pathname]);

  // Flag body so global CSS can indent main on desktop
  useEffect(() => {
    if (!isApp) return;
    document.body.dataset.appShell = "true";
    return () => {
      delete document.body.dataset.appShell;
    };
  }, [isApp]);

  // Mobile drawer a11y
  useEffect(() => {
    if (!drawerOpen) return;
    const prevFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      (openBtnRef.current ?? prevFocused)?.focus();
    };
  }, [drawerOpen]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  if (!isApp) return null;

  const NavList = (
    <nav className="nav-content" aria-label="App Navigation">
      <div className="nav-sections">
        {SIDEBAR_SECTIONS.map((section) => (
          <SidebarSectionItem
            key={section.id}
            section={section}
            pathname={pathname}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            onNavigate={drawerOpen ? closeDrawer : undefined}
          />
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="app-sidebar hidden lg:flex" data-testid="app-sidebar">
        <div className="app-sidebar-header">
          <Link href="/dashboard" className="app-sidebar-logo" aria-label="Huntaze dashboard">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold text-content-primary">Huntaze</span>
          </Link>
        </div>
        <div className="app-sidebar-content">{NavList}</div>
        <div className="app-sidebar-footer">
          <Link
            href="/onlyfans/ppv"
            className="nav-action-button"
          >
            <DollarSign className="inline-block w-4 h-4 mr-2" />
            Create PPV
          </Link>
          <button className="nav-ai-button" aria-label="Open AI Assistant">
            <Bot className="w-5 h-5" />
            <span>AI Assistant</span>
          </button>
        </div>
      </aside>

      {/* Mobile trigger */}
      <button
        ref={openBtnRef}
        aria-label="Open menu"
        className="mobile-drawer-trigger"
        onClick={() => setDrawerOpen(true)}
        data-testid="mobile-menu-trigger"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div 
            className="lg:hidden fixed inset-0 z-50" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            data-testid="mobile-drawer"
          >
            <motion.div
              className="mobile-drawer-overlay"
              onClick={closeDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mobile-drawer"
              tabIndex={-1}
            >
              <div className="mobile-drawer-header">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">H</span>
                  </div>
                  <span className="text-xl font-bold text-content-primary">Huntaze</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={closeDrawer} 
                  aria-label="Close menu"
                  className="mobile-drawer-close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">
                {NavList}
              </div>
              <div className="app-sidebar-footer">
                <Link
                  href="/onlyfans/ppv"
                  className="nav-action-button"
                  onClick={closeDrawer}
                >
                  <DollarSign className="inline-block w-4 h-4 mr-2" />
                  Create PPV
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
