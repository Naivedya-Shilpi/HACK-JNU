import { motion } from 'framer-motion'
import { FiClipboard, FiSearch, FiPlus, FiEdit } from 'react-icons/fi'

const TaskList = () => {
  const tasks = [
    { 
      title: 'Design Meeting', 
      time: '2 pm', 
      status: 'urgent',
      action: 'Join now',
      actionColor: 'blue'
    },
    { 
      title: 'Refine UI components based on user feedback', 
      status: 'urgent',
      priority: 'Urgent',
      deadline: 'By today',
      deadlineColor: 'red'
    },
    { 
      title: 'Prepare a prototype for usability testing', 
      status: 'in-progress',
      priority: 'In progress',
      deadline: 'By tomorrow',
      deadlineColor: 'green'
    },
    { 
      title: 'Collaborate with developers on implementation detail', 
      status: 'todo',
      priority: 'To do',
      deadline: 'By tomorrow',
      deadlineColor: 'green'
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent': return 'bg-red-500'
      case 'in-progress': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="p-6 rounded-xl glass border border-white/20 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiClipboard className="text-gray-700 dark:text-gray-300" size={20} />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            My Tasks <span className="text-gray-500 dark:text-gray-400 font-normal">13</span>
          </h3>
        </div>
        <button className="px-4 py-2 rounded-lg glass border border-purple-300/30 dark:border-purple-600/30 bg-purple-500/20 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-medium flex items-center gap-2 hover:bg-purple-500/30 transition-colors">
          <FiEdit size={16} />
          Prioritize Tasks
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search for name..."
            className="w-full pl-10 pr-10 py-2 rounded-lg glass border border-gray-200/30 dark:border-gray-700/50 bg-white/20 dark:bg-gray-700/20 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-white/20">
            <FiPlus className="text-gray-400" size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <motion.div
            key={idx}
            whileHover={{ x: 4 }}
            className="p-4 rounded-lg glass border border-gray-200/30 dark:border-gray-700/50 bg-white/20 dark:bg-gray-700/20 flex items-center gap-4"
          >
            <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {task.priority && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    task.priority === 'Urgent' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : task.priority === 'In progress'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400'
                  }`}>
                    {task.priority}
                  </span>
                )}
                {task.deadline && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    task.deadlineColor === 'red'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  }`}>
                    {task.deadline}
                  </span>
                )}
                {task.time && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {task.time}
                  </span>
                )}
              </div>
            </div>
            {task.action && (
              <button className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                task.actionColor === 'blue'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : ''
              } transition-colors`}>
                + {task.action}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default TaskList
