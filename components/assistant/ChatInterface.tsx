import React from 'react';

export default function ChatInterface(_props: {
  conversationId?: string;
  onSend?: (text: string, attachments?: File[]) => void;
}) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-slate-500">
      Chat UI placeholder — will use WebSocket/SSE + optimistic updates.
    </div>
  );
}

