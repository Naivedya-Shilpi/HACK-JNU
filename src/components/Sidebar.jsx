import { motion } from 'framer-motion'
import { 
  FiHome, 
  FiMessageSquare, 
  FiClipboard, 
  FiVideo, 
  FiFile, 
  FiShare2,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiLayout,
  FiClock
} from 'react-icons/fi'

const Sidebar = ({ collapsed, onToggle }) => {
  const menuItems = [
    { icon: FiHome, label: 'Home', active: true },
    { icon: FiLayout, label: 'Dashboard' },
    { icon: FiMessageSquare, label: 'New Chat' },
    { icon: FiClipboard, label: 'My Tasks' },
    { icon: FiVideo, label: 'My Meetings' },
    { icon: FiFile, label: 'Saved Files' },
    { icon: FiShare2, label: 'Shared with me' },
  ]

  const recentActivities = {
    'Today': [
      'Research Assistance Request',
      'Summarizing Last Meeting',
      'Prioritizing Tasks Request'
    ],
    'Yesterday': [
      'Document Summary Request'
    ]
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? '80px' : '280px' }}
      className={`h-screen bg-gray-800/40 dark:bg-gray-900/40 glass border-r border-gray-700/50 flex flex-col overflow-hidden backdrop-blur-xl`}
      style={{ backdropFilter: 'blur(20px)' }}
    >
      {/* Profile Section */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <FiUser className="text-white" size={20} />
            </div>
            {!collapsed && (
              <div>
                <p className="text-white font-medium text-sm">Business Owner</p>
                <p className="text-gray-400 text-xs">MSME Account</p>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto scroll-smooth py-4">
        <div className="px-2 space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.button
                key={index}
                whileHover={{ x: 4 }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  item.active
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </motion.button>
            )
          })}
        </div>

        {/* Chat History Section */}
        {!collapsed && (
          <div className="mt-6 px-4">
            <div className="flex items-center gap-2 mb-3 px-2">
              <FiClock className="text-gray-400" size={16} />
              <h3 className="text-gray-400 text-xs font-semibold uppercase">
                Chat History
              </h3>
            </div>
            <div className="space-y-4">
              {Object.entries(recentActivities).map(([day, activities]) => (
                <div key={day}>
                  <h3 className="text-gray-500 text-xs font-medium mb-2 px-2">
                    {day}
                  </h3>
                  <div className="space-y-1">
                    {activities.map((activity, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ x: 4 }}
                        className="w-full text-left px-2 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700/30 rounded transition-all"
                      >
                        {activity}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscription Card */}
        {!collapsed && (
          <div className="mt-6 mx-4 p-4 rounded-lg glass border border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5"></div>
              <div className="flex-1">
                <p className="text-yellow-400 text-sm font-medium mb-1">
                  Only 5 AI reports left
                </p>
                <p className="text-gray-300 text-xs mb-3">
                  Get deeper insights with Pro
                </p>
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded transition-colors">
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-700/50">
        <motion.button
          whileHover={{ x: 4 }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all"
        >
          <FiSettings size={20} />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Sidebar
