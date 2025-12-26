import { useState, useCallback, useEffect } from "react";
import {
  deleteAssistantConversation,
  getAssistantConversation,
  listAssistantConversations,
  sendAssistantMessage,
} from "@/lib/services/assistant";

export type Conversation = {
  id: string;
  title?: string;
  updatedAt?: string;
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
      const data = await listAssistantConversations();
      setConversations(data.conversations || []);
    } catch {}
  }, []);

  // Load a specific conversation
  const loadConversation = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await getAssistantConversation(id);
      setCurrentConversationId(id);
      setMessages(
        (data.conversation.messages || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  // Reload current conversation messages
  const reloadMessages = useCallback(async () => {
    if (!currentConversationId) return;
    
    try {
      const data = await getAssistantConversation(currentConversationId);
      setMessages(
        (data.conversation.messages || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
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
        const data = await sendAssistantMessage({
          conversationId: currentConversationId,
          message: content,
        });

        // Update conversation ID if new
        if (!currentConversationId && data.conversationId) {
          setCurrentConversationId(data.conversationId);
        }

        // Reload messages from server to get the actual saved messages
        if (data.conversationId) {
          const convData = await getAssistantConversation(data.conversationId);
          setMessages(
            (convData.conversation.messages || []).map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
            }))
          );
        }

        await fetchConversations();
        return data.reply;
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
        await deleteAssistantConversation(id);
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
