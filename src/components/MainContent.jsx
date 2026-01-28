import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WelcomeCard from './WelcomeCard'
import ChatInput from './ChatInput'
import chatService from '../services/chatService'

const MainContent = ({ sidebarCollapsed, userProfile }) => {
  const [showContent, setShowContent] = useState(true)
  const [chatMessages, setChatMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await chatService.resetSession(userProfile);
        setSessionId(session.sessionId);
        console.log('✅ Chat session initialized:', session.sessionId);
      } catch (error) {
        console.error('❌ Failed to initialize session:', error);
      }
    };
    
    if (userProfile) {
      initSession();
    }
  }, [userProfile]);

  const handleChatSubmit = async (message, attachments = []) => {
    if (message.trim() || attachments.length > 0) {
      setShowContent(false)
      setChatMessages([...chatMessages, { text: message, sender: 'user', attachments }])
      setIsLoading(true)
      
      try {
        const response = await chatService.sendMessage(message, userProfile, sessionId);
        setChatMessages(prev => [...prev, { 
          text: response.message, 
          sender: 'ai',
          type: response.type,
          data: response.data
        }])
      } catch (error) {
        console.error('❌ Backend error:', error);
        setChatMessages(prev => [...prev, { 
          text: '⚠️ Backend service unavailable. Please ensure the backend server is running on port 3001.', 
          sender: 'ai' 
        }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-4">
          <AnimatePresence mode="wait">
            {showContent ? (
              <motion.div
                key="content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{
                  opacity: 0,
                  transition: {
                    duration: 0.3,
                    staggerChildren: 0.05,
                    staggerDirection: -1,
                  },
                }}
              >
                <motion.div variants={itemVariants}>
                  <WelcomeCard />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
                className="flex flex-col pt-6"
              >
                <div className="space-y-4 max-w-4xl mx-auto w-full">
                  {chatMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: idx * 0.1,
                        type: 'spring',
                        stiffness: 200,
                        damping: 20,
                      }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`max-w-md px-4 py-3 rounded-2xl cursor-pointer ${
                          msg.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm dark:bg-gray-800 dark:text-gray-100'
                        }`}
                      >
                        {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {msg.attachments.map((att, attIdx) => (
                              <div key={attIdx} className="flex items-center gap-2 text-xs opacity-90">
                                {att.preview ? (
                                  <img src={att.preview} alt={att.name} className="w-8 h-8 rounded object-cover" />
                                ) : (
                                  <span>📄</span>
                                )}
                                <span>{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Input - always show when chat is active */}
      <div className="sticky bottom-0 z-20 shrink-0 bg-white/70 backdrop-blur-md dark:bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-6 pb-2 pt-1">
          <ChatInput onSubmit={handleChatSubmit} sidebarCollapsed={sidebarCollapsed} />
        </div>
      </div>
    </div>
  )
}

export default MainContent