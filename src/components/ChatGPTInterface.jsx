import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiMessageCircle, FiLoader, FiSend } from 'react-icons/fi'
import { useChatContext } from '../context/ChatContext'
import { useAppContext } from '../context/AppContext'

const ChatGPTInterface = ({ userProfile }) => {
  const { userIntent } = useAppContext()
  const {
    messages,
    isLoading,
    activeChatId,
    sendMessage,
    isSidebarOpen
  } = useChatContext()

  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when starting new chat
  useEffect(() => {
    if (!activeChatId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeChatId])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || isLoading) return

    const messageContent = inputMessage.trim()
    setInputMessage('')

    try {
      await sendMessage(messageContent, userProfile, userIntent)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user'
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-emerald-500 text-white'
          }`}>
            {isUser ? <FiUser size={16} /> : <FiMessageCircle size={16} />}
          </div>

          {/* Message Content */}
          <div className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <p className={`text-xs mt-2 ${
              isUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const WelcomeMessage = () => (
    <div className="text-center py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <FiMessageCircle className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          MSME Compliance Navigator
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm">
          I'm here to help you start and grow your business in India with all the right compliance requirements.
        </p>
        {userIntent && (
          <div className="mt-3 inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm">
            Focus: {userIntent.replace('_', ' ')}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {[
          { icon: '📋', title: 'Business Registration', desc: 'GST, PAN, licenses' },
          { icon: '📅', title: 'Compliance Calendar', desc: 'Deadlines & filings' },
          { icon: '🚀', title: 'Platform Onboarding', desc: 'Amazon, Flipkart, etc.' }
        ].map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setInputMessage(`Tell me about ${card.title.toLowerCase()}`)}
          >
            <div className="text-xl mb-2">{card.icon}</div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1 text-sm">
              {card.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {card.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ${
      isSidebarOpen ? 'ml-80' : 'ml-0'
    }`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-medium text-slate-900 dark:text-slate-100">
              {activeChatId ? 'Chat' : 'New Conversation'}
            </h1>
            {userIntent && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Intent: {userIntent.replace('_', ' ')}
              </p>
            )}
          </div>
          {activeChatId && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {messages.length} messages
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50 dark:bg-slate-950">
        {messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          <div className="max-w-4xl mx-auto">
            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <FiMessageCircle size={16} className="text-white" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FiLoader className="w-4 h-4 animate-spin text-emerald-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message MSME Compliance Navigator..."
                className="w-full px-4 py-3 pr-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-500"
                rows="1"
                style={{ 
                  minHeight: '48px',
                  maxHeight: '120px',
                  height: 'auto'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                disabled={isLoading}
              />
              
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 text-slate-500 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  )
}

export default ChatGPTInterface