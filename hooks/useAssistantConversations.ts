import { useState, useCallback, useEffect } from "react";

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages?: { content: string }[];
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export function useAssistantConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/assistant/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {}
  }, []);

  // Load a specific conversation
  const loadConversation = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assistant/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentConversationId(id);
        setMessages(
          data.conversation.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  // Reload current conversation messages
  const reloadMessages = useCallback(async () => {
    if (!currentConversationId) return;
    
    try {
      const res = await fetch(`/api/assistant/conversations/${currentConversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.conversation.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      }
    } catch {}
  }, [currentConversationId]);

  // Create new conversation
  const createConversation = useCallback(async () => {
    setCurrentConversationId(null);
    setMessages([]);
    await fetchConversations();
  }, [fetchConversations]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: currentConversationId,
            message: content,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Update conversation ID if new
          if (!currentConversationId && data.conversationId) {
            setCurrentConversationId(data.conversationId);
          }

          // Reload messages from server to get the actual saved messages
          if (data.conversationId) {
            const convRes = await fetch(`/api/assistant/conversations/${data.conversationId}`);
            if (convRes.ok) {
              const convData = await convRes.json();
              setMessages(
                convData.conversation.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  createdAt: m.createdAt,
                  }))
              );
            }
          }

          await fetchConversations();
          return data.reply;
        } else {
          // Parse error response
          let errorData;
          try {
            errorData = await res.json();
          } catch {
            errorData = { error: "Failed to send message" };
          }
          
          const errorMessage = errorData.error || "Failed to send message";
          
          throw new Error(errorMessage);
        }
      } catch (e) {
        throw e;
      }
    },
    [currentConversationId, fetchConversations]
  );

  // Delete conversation
  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/assistant/conversations/${id}`, { method: "DELETE" });
        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setMessages([]);
        }
        await fetchConversations();
      } catch {}
    },
    [currentConversationId, fetchConversations]
  );

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    currentConversationId,
    messages,
    loading,
    fetchConversations,
    loadConversation,
    createConversation,
    sendMessage,
    deleteConversation,
  };
}
