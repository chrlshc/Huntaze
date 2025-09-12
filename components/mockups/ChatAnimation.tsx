'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  from: 'fan' | 'ai';
  text: string;
  typing?: boolean;
}

interface ChatAnimationProps {
  messages?: Message[];
  autoPlay?: boolean;
  delay?: number;
}

const defaultMessages: Message[] = [
  { id: 1, from: 'fan', text: 'Hey are you online? 💕' },
  { id: 2, from: 'ai', text: 'Yes babe! How can I help you? 😊' },
  { id: 3, from: 'fan', text: 'Looking for custom content' },
  { id: 4, from: 'ai', text: 'I have something perfect for you...' },
  { id: 5, from: 'fan', text: 'Can I see a preview?' },
  { id: 6, from: 'ai', text: 'Check your DMs for a special surprise 🔥' }
];

const TypingIndicator = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.8 }}
        className="flex justify-start mb-3"
      >
        <div className="flex gap-1 p-3 bg-gray-800 rounded-2xl">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function ChatAnimation({ 
  messages = defaultMessages, 
  autoPlay = true,
  delay = 0 
}: ChatAnimationProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay) return;

    const showNextMessage = () => {
      if (currentIndex >= messages.length) {
        // Reset and loop
        setTimeout(() => {
          setVisibleMessages([]);
          setCurrentIndex(0);
        }, 3000);
        return;
      }

      const nextMessage = messages[currentIndex];
      
      // Show typing indicator for AI messages
      if (nextMessage.from === 'ai') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages(prev => [...prev, nextMessage]);
          setCurrentIndex(currentIndex + 1);
        }, 1500);
      } else {
        setVisibleMessages(prev => [...prev, nextMessage]);
        setCurrentIndex(currentIndex + 1);
      }
    };

    const timer = setTimeout(showNextMessage, currentIndex === 0 ? delay * 1000 : 1000);
    return () => clearTimeout(timer);
  }, [currentIndex, messages, autoPlay, delay]);

  return (
    <div className="h-full bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
          <div>
            <div className="font-semibold text-white">Sarah Miller</div>
            <div className="text-xs text-green-400">Online now</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex mb-3 ${msg.from === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                msg.from === 'ai' 
                  ? 'bg-gray-800 text-white rounded-bl-sm' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-sm'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <TypingIndicator show={isTyping} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled
          />
          <button className="p-2 bg-purple-600 rounded-full text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}