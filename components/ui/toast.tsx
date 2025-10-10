"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      timeouts.current[id] = setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  useEffect(() => {
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-3">
        <div role="status" aria-live="polite" className="sr-only">
          {toasts.length ? toasts[toasts.length - 1].title : ""}
        </div>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-lg border px-4 py-3 shadow-lg transition-opacity",
              toast.variant === "success" && "border-green-500/40 bg-green-500/10 text-green-100",
              toast.variant === "error" && "border-red-500/40 bg-red-500/10 text-red-100",
              toast.variant === "default" && "border-white/10 bg-gray-800 text-gray-100",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm text-gray-300">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 text-sm text-gray-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
