import { motion } from 'framer-motion'
import { FiStar, FiCalendar } from 'react-icons/fi'

const MeetingCard = () => {
  return (
    <div className="p-6 rounded-xl glass border border-white/20 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30">
      <div className="flex items-center gap-2 mb-4">
        <FiStar className="text-yellow-500" size={18} />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Summarize your last meeting
        </h3>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
          <span className="text-white text-sm font-medium">UX</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            Compliance Strategy Meet up
          </p>
          <div className="flex items-center gap-2 mt-1">
            <FiCalendar className="text-gray-500 dark:text-gray-400" size={14} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              1 Apr 2025, 14:00 pm
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MeetingCard
