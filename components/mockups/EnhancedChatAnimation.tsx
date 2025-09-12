'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Heart, DollarSign, Image as ImageIcon, Mic } from 'lucide-react';

interface Message {
  id: string;
  text?: string;
  type: 'text' | 'image' | 'voice' | 'tip';
  sender: 'user' | 'ai';
  time: string;
  seen?: boolean;
  reactions?: string[];
  amount?: number;
  duration?: string;
}

const messages: Message[] = [
  { id: '1', type: 'text', text: "Hey babe! How are you tonight? 😘", sender: 'user', time: '9:42 PM' },
  { id: '2', type: 'text', text: "I'm doing amazing! Just thinking about you 💕 What are you up to?", sender: 'ai', time: '9:42 PM', seen: true },
  { id: '3', type: 'tip', amount: 50, sender: 'user', time: '9:43 PM' },
  { id: '4', type: 'text', text: "Omg thank you so much! You're the best! 🥰", sender: 'ai', time: '9:43 PM', reactions: ['❤️'] },
  { id: '5', type: 'image', sender: 'ai', time: '9:44 PM' },
  { id: '6', type: 'text', text: "Wow! You look incredible! 🔥", sender: 'user', time: '9:44 PM', reactions: ['😍', '🔥'] },
  { id: '7', type: 'voice', duration: '0:23', sender: 'ai', time: '9:45 PM' },
  { id: '8', type: 'text', text: "I have something special for my VIPs... interested? 😏", sender: 'ai', time: '9:45 PM' },
];

export default function EnhancedChatAnimation() {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentReactions, setCurrentReactions] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    // Display messages one by one
    const timer = setInterval(() => {
      setDisplayedMessages(prev => {
        if (prev.length < messages.length) {
          const nextMessage = messages[prev.length];
          
          // Show typing indicator before AI messages
          if (nextMessage.sender === 'ai' && prev.length > 0) {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              setDisplayedMessages(current => [...current, nextMessage]);
            }, 1500);
            return prev;
          }
          
          return [...prev, nextMessage];
        }
        return [];
      });
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Animate reactions
  useEffect(() => {
    const reactionTimer = setTimeout(() => {
      const messageWithReaction = displayedMessages.find(m => m.reactions && !currentReactions[m.id]);
      if (messageWithReaction && messageWithReaction.reactions) {
        setCurrentReactions(prev => ({
          ...prev,
          [messageWithReaction.id]: messageWithReaction.reactions || []
        }));
      }
    }, 1000);

    return () => clearTimeout(reactionTimer);
  }, [displayedMessages, currentReactions]);

  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'tip':
        return (
          <motion.div 
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl"
            whileHover={{ scale: 1.02 }}
          >
            <DollarSign className="w-5 h-5" />
            <span className="font-bold">${message.amount} Tip received!</span>
          </motion.div>
        );
      
      case 'image':
        return (
          <div className="relative">
            <div className="w-48 h-64 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-white/50" />
              </div>
              <motion.div 
                className="absolute inset-0 bg-black/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
              Premium
            </div>
          </div>
        );
      
      case 'voice':
        return (
          <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 min-w-[200px]">
            <motion.div
              className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Mic className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <div className="h-6 flex items-center gap-1">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-purple-400 rounded-full"
                    style={{ height: Math.random() * 20 + 5 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-gray-400">{message.duration}</span>
          </div>
        );
      
      default:
        return (
          <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
            message.sender === 'user' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-800 text-white'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-950" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">Sarah M.</h3>
          <p className="text-xs text-green-400">Active now</p>
        </div>
        <motion.div 
          className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          AI Active
        </motion.div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {displayedMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} relative`}
            >
              <div>
                {renderMessage(message)}
                
                {/* Time and seen status */}
                <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <span>{message.time}</span>
                  {message.sender === 'ai' && message.seen && (
                    <CheckCheck className="w-3 h-3 text-blue-400" />
                  )}
                </div>
                
                {/* Reactions */}
                {currentReactions[message.id] && (
                  <motion.div 
                    className="absolute -bottom-2 right-0 flex gap-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    {currentReactions[message.id].map((reaction, i) => (
                      <motion.span
                        key={i}
                        className="text-xl"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: i * 0.1, type: "spring" }}
                      >
                        {reaction}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gray-500 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}