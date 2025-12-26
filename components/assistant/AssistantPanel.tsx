"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ChatClient from "./ChatClient";
import { Maximize2 } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";

function safeBack(router: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined" && window.history.length > 1) router.back();
  else router.push("/home");
}

export default function AssistantPanel({
  fullscreen = false,
  topOffsetPx = 64,
  widthPx = 420,
}: {
  fullscreen?: boolean;
  topOffsetPx?: number;
  widthPx?: number;
}) {
  const router = useRouter();
  const mounted = useIsClient();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") safeBack(router);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  if (!mounted) return null;

  const node = (
    <aside
      aria-label="Assistant"
      style={{
        position: "fixed",
        zIndex: 2147483647,
        right: 0,
        top: fullscreen ? 0 : topOffsetPx,
        width: fullscreen ? "100vw" : widthPx,
        height: fullscreen ? "100dvh" : `calc(100dvh - ${topOffsetPx}px)`,
        background: "white",
        borderLeft: fullscreen ? "none" : "1px solid rgba(0,0,0,0.12)",
        boxShadow: fullscreen ? "none" : "0 20px 50px rgba(0,0,0,0.20)",
      }}
    >
      {/* HEADER avec gradient "Magic" */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-white to-white">
        <div className="flex items-center gap-3">
          <div 
            className="p-1.5 rounded-lg shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #a03b92, #6a359c, #552586)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 14L17 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14V21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 5.99998C16 3.79084 14.2091 1.99998 12 1.99998C9.79086 1.99998 8 3.79084 8 5.99998C8 8.20912 9.79086 9.99998 12 9.99998C14.2091 9.99998 16 8.20912 16 5.99998Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.72266 20.2344C4.90841 18.0238 5.98977 16.0027 7.73947 14.6221" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.2773 20.2344C19.0916 18.0238 18.0102 16.0027 16.2605 14.6221" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Assistant</h2>
            <p className="text-xs text-gray-500">Votre majordome IA</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!fullscreen && (
            <button
              onClick={() => (window.location.href = "/assistant")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Plein écran"
              aria-label="Plein écran"
            >
              <Maximize2 className="w-5 h-5 text-gray-500" />
            </button>
          )}
          <button
            onClick={() => safeBack(router)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            aria-label="Fermer"
            title="Fermer"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* BODY avec fond subtil */}
      <div 
        className="overflow-y-auto"
        style={{
          height: 'calc(100% - 72px)',
          background: 'linear-gradient(to bottom, rgba(168, 85, 247, 0.02), rgba(255, 255, 255, 0))',
        }}
      >
        <ChatClient />
      </div>
    </aside>
  );

  return createPortal(node, document.body);
}
