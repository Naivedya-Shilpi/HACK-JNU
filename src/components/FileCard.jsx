import { motion } from 'framer-motion'
import { FiFile, FiMoreVertical } from 'react-icons/fi'

const FileCard = () => {
  const files = [
    { name: 'Miro - Product Analytics and Statistics', type: 'miro', colorClass: 'bg-yellow-100 dark:bg-yellow-900/30', iconClass: 'text-yellow-600 dark:text-yellow-400' },
    { name: 'Figma - UX Research', type: 'figma', colorClass: 'bg-purple-100 dark:bg-purple-900/30', iconClass: 'text-purple-600 dark:text-purple-400' },
    { name: 'R2 Strategic Goals & Objectives.pdf', type: 'pdf', colorClass: 'bg-red-100 dark:bg-red-900/30', iconClass: 'text-red-600 dark:text-red-400' },
  ]

  return (
    <div className="p-6 rounded-xl glass border border-yellow-200/30 dark:border-yellow-500/30 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/20 dark:to-orange-900/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiFile className="text-yellow-600 dark:text-yellow-400" size={20} />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Previously viewed files
          </h3>
        </div>
        <button className="p-1 rounded hover:bg-white/20 text-gray-600 dark:text-gray-400">
          <FiMoreVertical size={18} />
        </button>
      </div>
      
      <div className="space-y-3">
        {files.map((file, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.02, x: 4 }}
            className="p-3 rounded-lg glass border border-white/20 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${file.colorClass}`}>
                <FiFile className={file.iconClass} size={16} />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{file.name}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default FileCard
