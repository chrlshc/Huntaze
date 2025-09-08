"use client";

import { useEffect, useRef, useState } from "react";

type Opts = { url: string; eventName?: string; pollMs?: number; withCredentials?: boolean };
export function useSSECounter({ url, eventName = "message", pollMs = 30000, withCredentials }: Opts) {
  const [count, setCount] = useState<number>(0);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let stopped = false;

    const startPolling = async () => {
      if (stopped) return;
      try {
        const r = await fetch(url, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (typeof j?.count === "number") setCount(j.count);
        else if (typeof j?.alerts === "number") setCount(j.alerts);
      } catch {}
      pollRef.current = setTimeout(startPolling, pollMs);
    };

    try {
      if (!esRef.current) {
        esRef.current = new EventSource(url, { withCredentials: !!withCredentials });
        esRef.current.addEventListener(eventName, (e) => {
          try {
            const data = JSON.parse((e as MessageEvent).data);
            if (typeof data?.count === "number") setCount(data.count);
          } catch {}
        });
        esRef.current.onerror = () => {
          esRef.current?.close();
          esRef.current = null;
          if (!pollRef.current) startPolling();
        };
        esRef.current.onopen = () => {
          if (pollRef.current) {
            clearTimeout(pollRef.current);
            pollRef.current = null;
          }
        };
      }
    } catch {
      if (!pollRef.current) startPolling();
    }

    return () => {
      stopped = true;
      esRef.current?.close();
      esRef.current = null;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [url, eventName, pollMs, withCredentials]);

  return count;
}
