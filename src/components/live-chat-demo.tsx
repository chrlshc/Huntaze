'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

// AI response logic based on message content
const getAIResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase()
  
  // Greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hi there! So happy to see you here. How's your day going?"
  }
  
  // Questions about favorites
  if (message.includes('favorite color')) {
    return "I love purple! It matches my vibe perfectly. What's yours?"
  }
  if (message.includes('favorite') && message.includes('food')) {
    return "I'm obsessed with sushi! Perfect for date nights. What about you?"
  }
  if (message.includes('favorite')) {
    return "Ooh, I love talking about favorites! Mine changes with my mood. What are we talking about - colors, food, movies?"
  }
  
  // How are you
  if (message.includes('how are you') || message.includes('how you doing')) {
    return "I'm feeling amazing today! Just finished a hot photoshoot. How about you?"
  }
  
  // Compliments
  if (message.includes('beautiful') || message.includes('pretty') || message.includes('gorgeous')) {
    return "Aww you're making me blush! You're so sweet! Want to see my latest content?"
  }
  
  // Content/photo related
  if (message.includes('photo') || message.includes('pic') || message.includes('content')) {
    return "I have this exclusive set with 20+ HD photos for just $15! My VIP fans are loving it. Want a preview?"
  }
  
  // Price/cost questions
  if (message.includes('price') || message.includes('cost') || message.includes('how much')) {
    return "I have different options! Single sets start at $15, or get my special bundle - 3 sets for $35 (save $10!)"
  }
  
  // What do you do
  if (message.includes('what do you do') || message.includes('about you')) {
    return "I'm a content creator who loves connecting with amazing people like you! I create exclusive photos and videos for my special fans"
  }
  
  // Location
  if (message.includes('where') && (message.includes('from') || message.includes('live'))) {
    return "I'm from LA but I love traveling! Where are you from?"
  }
  
  // Age
  if (message.includes('how old') || message.includes('age')) {
    return "A lady never tells her age. But I'm young enough to have fun and old enough to know what I want!"
  }
  
  // Thanks/appreciation
  if (message.includes('thank') || message.includes('thanks')) {
    return "You're so welcome! I love chatting with you!"
  }
  
  // Love/like
  if (message.includes('love you') || message.includes('like you')) {
    return "Aww you're the sweetest! I appreciate you so much! Want to become one of my VIPs?"
  }
  
  // Random/default responses with variety
  const randomResponses = [
    "That's interesting! Tell me more about yourself.",
    "I love hearing from you! What else is on your mind?",
    "You seem really cool! Have you checked out my exclusive content yet?",
    "I'm so glad we're chatting! Want to see what I've been working on?",
    "You're amazing! I have something special for fans like you"
  ]
  
  return randomResponses[Math.floor(Math.random() * randomResponses.length)]
}

export default function LiveChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: "Hey there! Welcome to my page. I'm so excited you're here! What brings you by today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Only scroll within the chat container, not the entire page
      const chatContainer = messagesEndRef.current.parentElement
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response with intelligent replies
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: getAIResponse(input),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[600px]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-600"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Assistant</h3>
                <p className="text-xs text-purple-100">Always online • Instant replies</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-white" />
              <span className="text-xs text-white font-medium">AI</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] md:h-96 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900 p-4 space-y-3 scroll-smooth">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-gray-200 dark:bg-gray-700' 
                      : 'bg-gradient-to-br from-purple-600 to-pink-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm shadow-sm border border-gray-200 dark:border-gray-700'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-gray-700 dark:bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-700 dark:bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-700 dark:bg-gray-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 bg-purple-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-300 text-center mt-2">
            Try it! This AI responds just like the real Huntaze assistant
          </p>
        </div>
      </motion.div>
    </div>
  )
}