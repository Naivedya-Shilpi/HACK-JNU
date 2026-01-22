import { motion } from 'framer-motion'
import { FiSun, FiMoon, FiLogIn } from 'react-icons/fi'

const TopBar = ({ isDark, onThemeToggle }) => {
  return (
    <div className={`h-16 px-6 flex items-center justify-between glass border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-xl`}>
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
          MSME Compliance Navigator
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onThemeToggle}
          className="p-2 rounded-lg glass text-gray-700 dark:text-yellow-400 hover:bg-opacity-30 transition-all"
        >
          {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
        </motion.button>

        {/* Google Login Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-lg glass flex items-center gap-2 text-gray-700 dark:text-white border border-gray-300/50 dark:border-gray-600/50 hover:bg-opacity-30 transition-all"
        >
          <FiLogIn size={18} />
          <span className="text-sm font-medium">Login with Google</span>
        </motion.button>
      </div>
    </div>
  )
}

export default TopBar
