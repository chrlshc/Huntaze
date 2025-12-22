"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAssistant } from "@/contexts/AssistantContext";
import ChatClient from "./ChatClient";
import { X, ChevronDown, Trash2 } from "lucide-react";
import { useAssistantConversations } from "@/hooks/useAssistantConversations";

export default function AssistantDrawer() {
  const { isOpen, closeAssistant } = useAssistant();
  const {
    conversations,
    currentConversationId,
    loadConversation,
    createConversation,
    deleteConversation,
    fetchConversations,
  } = useAssistantConversations();

  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const layout = document.querySelector<HTMLElement>(".huntaze-layout");
    if (!layout) return;
    if (isOpen) {
      layout.setAttribute("data-assistant-open", "true");
    } else {
      layout.removeAttribute("data-assistant-open");
    }
    return () => layout.removeAttribute("data-assistant-open");
  }, [isOpen, mounted]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeAssistant();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeAssistant]);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      wasOpenRef.current = true;
      lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();
      return;
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      lastFocusedElementRef.current?.focus?.();
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!mounted || !isOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (!firstElement || !lastElement) return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    drawer.addEventListener("keydown", handleTab);
    return () => drawer.removeEventListener("keydown", handleTab);
  }, [isOpen, mounted]);

  const handleNewConversation = useCallback(() => {
    createConversation();
    setDropdownOpen(false);
  }, [createConversation]);

  const handleSelectConversation = useCallback((id: string) => {
    loadConversation(id);
    setDropdownOpen(false);
  }, [loadConversation]);

  const handleDeleteConversation = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
  }, [deleteConversation]);

  const currentTitle = conversations.find(c => c.id === currentConversationId)?.title || "New conversation";

  if (!mounted) return null;

  return (
    <aside
      id="majordome-drawer"
      ref={drawerRef}
      role="complementary"
      aria-label="Majordome"
      aria-hidden={!isOpen}
      data-open={isOpen}
      className={isOpen ? 'lg:w-[400px] lg:min-w-[400px]' : 'w-0 min-w-0'}
      style={{
        width: isOpen ? undefined : '0px',
        minWidth: isOpen ? undefined : '0px',
      }}
    >
      <div
        className="w-full lg:w-[400px]"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "white",
        }}
      >
        {/* HEADER */}
        <header 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            background: '#ffffff',
          }}
        >
          {/* Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#000',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {currentTitle.length > 25 ? currentTitle.slice(0, 25) + '...' : currentTitle}
              <ChevronDown 
                style={{ 
                  width: '14px', 
                  height: '14px', 
                  color: '#000',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }} 
              />
            </button>
            
            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  width: '280px',
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {/* New conversation button */}
                <button
                  onClick={handleNewConversation}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#f9fafb',
                    border: 'none',
                    borderBottom: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#7c3aed',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  New conversation
                </button>

                {/* Conversations list */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {conversations.length === 0 ? (
                    <div style={{ padding: '16px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>
                      No conversations yet
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: conv.id === currentConversationId ? '#f3f4f6' : 'transparent',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: conv.id === currentConversationId ? 600 : 400,
                            color: '#333',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {conv.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            borderRadius: '4px',
                          }}
                          aria-label="Delete conversation"
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Action icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={handleNewConversation}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
                padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
              aria-label="Nouvelle conversation"
              title="Nouvelle conversation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              ref={closeButtonRef}
              onClick={closeAssistant}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
                padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
              aria-label="Fermer"
              title="Fermer"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <ChatClient onConversationsChange={fetchConversations} />
        </div>
      </div>
    </aside>
  );
}
