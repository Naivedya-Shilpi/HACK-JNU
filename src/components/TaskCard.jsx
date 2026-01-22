import { motion } from 'framer-motion'
import { FiSettings } from 'react-icons/fi'

const TaskCard = ({ title, description }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="p-6 rounded-xl glass border border-white/20 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30"
    >
      <div className="flex items-center gap-2 mb-3">
        <FiSettings className="text-blue-500" size={18} />
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          Suggested Task
        </h3>
      </div>
      <p className="text-base font-bold text-gray-800 dark:text-white">
        {title}
      </p>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
    </motion.div>
  )
}

export default TaskCard
