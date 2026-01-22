import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WelcomeCard from './WelcomeCard'
import FileCard from './FileCard'
import MeetingCard from './MeetingCard'
import TaskCard from './TaskCard'
import TaskList from './TaskList'
import ChatInput from './ChatInput'

const MainContent = () => {
  const [showContent, setShowContent] = useState(true)
  const [chatMessages, setChatMessages] = useState([])

  const handleChatSubmit = (message) => {
    if (message.trim()) {
      // Hide content with parallax animation
      setShowContent(false)
      // Add message to chat
      setChatMessages([...chatMessages, { text: message, sender: 'user' }])
    }
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative pb-24">
      <div className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {showContent ? (
            <motion.div
              key="content"
              initial={{ opacity: 1 }}
              exit={{ 
                opacity: 0,
                transition: { 
                  duration: 0.8,
                  staggerChildren: 0.1,
                  delayChildren: 0.1
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.5 }}
              >
                <WelcomeCard />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-6"
              >
                <FileCard />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <MeetingCard />
                <TaskCard 
                  title="Conduct UX Research"
                  description="Research user experience patterns"
                />
                <TaskCard 
                  title="Write a prospect email"
                  description="Draft email for potential clients"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6"
              >
                <TaskList />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="min-h-[60vh] flex flex-col justify-center pb-20"
            >
              <div className="space-y-4">
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-lg glass ${
                      msg.sender === 'user'
                        ? 'bg-blue-500/20 border border-blue-500/30 ml-auto max-w-md'
                        : 'bg-gray-700/20 border border-gray-600/30 max-w-md'
                    }`}
                  >
                    <p className="text-gray-800 dark:text-white text-sm">{msg.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <ChatInput onSubmit={handleChatSubmit} />
    </div>
  )
}

export default MainContent
