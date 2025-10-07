"use client";
import { useEffect, useRef, useState } from 'react';

export default function ThreadView({ initial, threadId }: { initial: any; threadId: string }) {
  const [data, setData] = useState<any>(initial);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(async () => {
      const res = await fetch(`/api/of/threads/${threadId}`, { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    }, 5000);
    return () => clearInterval(t);
  }, [threadId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [data]);

  const send = async () => {
    // TODO: wire to a real send endpoint when available
    setText('');
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-slate-200 bg-white">
      <header className="border-b px-4 py-2">
        <h2 className="text-sm font-medium truncate">Thread {threadId}</h2>
      </header>
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {data?.messages?.map((m: any) => (
          <div key={m.id} className={m.isFromCreator ? 'text-right' : ''}>
            <div className={`inline-block rounded px-3 py-2 ${m.isFromCreator ? 'bg-blue-600 text-white' : 'border'}`}>{m.content?.text || ''}</div>
            <div className="text-[10px] opacity-60">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
      <footer className="border-t p-2 flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" value={text} onChange={e => setText(e.target.value)} placeholder="Type a message" />
        <button className="px-3 py-2 border rounded bg-blue-600 text-white" onClick={send}>Send</button>
      </footer>
    </div>
  );
}

