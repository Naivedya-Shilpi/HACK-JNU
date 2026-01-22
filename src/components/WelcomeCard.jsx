import { motion } from 'framer-motion'

const WelcomeCard = () => {
  return (
    <div className="p-6 rounded-xl glass border border-blue-200/30 dark:border-blue-500/30 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Welcome, Business Owner! 👋
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          How can I help you with your compliance requirements today?
        </p>
      </motion.div>
    </div>
  )
}

export default WelcomeCard
