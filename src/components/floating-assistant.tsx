"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";

const suggestions = [
  "How much can I earn with Huntaze?",
  "Show me success stories",
  "What makes Huntaze different?",
  "I'm making $5K/month, which plan?",
];

const responses = {
  "How much can I earn with Huntaze?": "Creators often save 20+ hours weekly with AI handling routine messaging. Many report 2–3x revenue growth over time — results vary.",
  "Show me success stories": "One creator went from $3K to $8K/month in 4 months; another scaled from $8K to $20K/month. 5,000+ creators use our AI today.",
  "What makes Huntaze different?": "We train on your best‑performing conversations to match your tone and guardrails — not generic templates.",
  "I'm making $5K/month, which plan?": "Great! Our Pro plan ($39/mo) fits creators at your stage: 5,000 AI messages, advanced analytics, and you approve before sending. Many report strong growth after setup."
};

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Show assistant after 5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSuggestion = async (suggestion: string) => {
    setMessages([...messages, { text: suggestion, isUser: true }]);
    setIsTyping(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setMessages(prev => [...prev, { text: responses[suggestion as keyof typeof responses], isUser: false }]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center group"
            onClick={() => setIsOpen(true)}
          >
            <MessageSquare className="w-7 h-7 text-white" />
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Your AI Success Coach</div>
                    <div className="text-xs opacity-90">Always here to help</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-lg font-semibold mb-2">
                    Hi! I'm your AI success coach 👋
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Ask me anything about growing your creator business
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestion(suggestion)}
                        className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                          message.isUser
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {message.text}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
