import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiSend } from 'react-icons/fi'

const ChatInput = ({ onSubmit }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      onSubmit(message)
      setMessage('')
    }
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="fixed bottom-6 left-0 right-0 max-w-7xl mx-auto px-6 z-10"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass border border-gray-200/30 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 rounded-lg glass border border-purple-300/30 dark:border-purple-600/30 bg-purple-500/20 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-500/30 transition-colors"
            >
              <FiPlus size={20} />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask or search for anything. Use @ to tag a file or collection."
              className="flex-1 bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
            <button
              type="submit"
              className="p-2 rounded-lg glass border border-gray-300/30 dark:border-gray-600/30 bg-gray-100/20 dark:bg-gray-700/20 text-gray-600 dark:text-gray-400 hover:bg-gray-200/30 dark:hover:bg-gray-600/30 transition-colors"
            >
              <FiSend size={20} />
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  )
}

export default ChatInput
