import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FiShield, 
  FiAlertTriangle, 
  FiClock, 
  FiMessageCircle,
  FiTrendingUp,
  FiFileText,
  FiEye,
  FiCheck,
  FiX
} from 'react-icons/fi'

const Dashboard = ({ userProfile, sessionId }) => {
  const [complianceData, setComplianceData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Mock data for now - this will come from your backend
  const mockDashboardData = {
    complianceScore: 72,
    pendingTasks: 3,
    upcomingDeadlines: 2,
    chatTopics: 5,
    complianceBreakdown: [
      { name: 'GST Compliance', value: 85, color: 'bg-green-500' },
      { name: 'Labor Laws', value: 60, color: 'bg-yellow-500' },
      { name: 'Trade License', value: 45, color: 'bg-red-500' },
      { name: 'FSSAI', value: 90, color: 'bg-green-500' }
    ],
    riskLevels: [
      { level: 'Low', count: 2, color: 'bg-green-500' },
      { level: 'Medium', count: 3, color: 'bg-yellow-500' },
      { level: 'High', count: 1, color: 'bg-red-500' }
    ],
    pendingTasksList: [
      {
        id: 1,
        title: 'File GST Return',
        priority: 'High',
        deadline: '2 days',
        status: 'pending'
      },
      {
        id: 2,
        title: 'Apply Trade License',
        priority: 'Medium',
        deadline: '5 days',
        status: 'pending'
      },
      {
        id: 3,
        title: 'FSSAI Renewal',
        priority: 'Low',
        deadline: '15 days',
        status: 'pending'
      }
    ],
    chatInsights: [
      'GST registered but GSTR-3B filing pending',
      'Trade License not applied',
      'Labor compliance awareness missing'
    ],
    recommendedActions: [
      {
        title: 'File GST Return',
        priority: 'High',
        description: 'GSTR-3B due in 2 days to avoid penalty'
      },
      {
        title: 'Apply Trade License',
        priority: 'Medium', 
        description: 'Municipal approval required for operations'
      }
    ]
  }

  useEffect(() => {
    // Fetch dashboard data from backend
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const response = await fetch('http://localhost:3001/api/dashboard', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            userProfile,
            sessionId 
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          setComplianceData(result.data)
        } else {
          console.error('Failed to fetch dashboard data')
          // Fall back to mock data
          setComplianceData(mockDashboardData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Fall back to mock data
        setComplianceData(mockDashboardData)
      } finally {
        setLoading(false)
      }
    }

    if (userProfile) {
      fetchDashboardData()
    }
  }, [userProfile, sessionId])

  if (loading) {
    return (
      <div className="flex-1 h-[calc(100vh-4rem)] bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] bg-white dark:bg-slate-950 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            MSME Compliance Navigator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {userProfile?.businessOwnerName || 'Business Owner'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FiShield}
            title="Compliance Score"
            value={`${complianceData.complianceScore}%`}
            color="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-50 dark:bg-blue-950"
          />
          <StatCard
            icon={FiAlertTriangle}
            title="Pending Tasks"
            value={complianceData.pendingTasks}
            color="text-yellow-600 dark:text-yellow-400"
            bgColor="bg-yellow-50 dark:bg-yellow-950"
          />
          <StatCard
            icon={FiClock}
            title="Upcoming Deadlines"
            value={complianceData.upcomingDeadlines}
            color="text-red-600 dark:text-red-400"
            bgColor="bg-red-50 dark:bg-red-950"
          />
          <StatCard
            icon={FiMessageCircle}
            title="Chat Topics"
            value={complianceData.chatTopics}
            color="text-green-600 dark:text-green-400"
            bgColor="bg-green-50 dark:bg-green-950"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Compliance Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Compliance Breakdown
            </h3>
            <div className="space-y-4">
              {complianceData.complianceBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 min-w-[3rem]">
                      {item.value}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Levels Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Risk Levels
            </h3>
            <div className="space-y-6">
              {complianceData.riskLevels.map((risk, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {risk.level}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${risk.color} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{risk.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Chat Insights */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Chat Insights
            </h3>
            <div className="space-y-3">
              {complianceData.chatInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {insight}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Recommended Actions
            </h3>
            <div className="space-y-4">
              {complianceData.recommendedActions.map((action, index) => (
                <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      action.priority === 'High' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : action.priority === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      Priority: {action.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {action.description}
                  </p>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    <div className="flex items-center gap-2">
                      <FiEye size={16} />
                      View Details
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Tasks Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Pending Tasks
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Task</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Priority</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Deadline</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {complianceData.pendingTasksList.map((task) => (
                  <tr key={task.id} className="border-b border-gray-100 dark:border-slate-800">
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                      {task.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'High' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : task.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {task.deadline}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded">
                          <FiCheck size={16} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded">
                          <FiX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable StatCard component
const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${bgColor} rounded-xl p-6 border border-gray-100 dark:border-slate-800`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900' : 
                        color.includes('yellow') ? 'bg-yellow-100 dark:bg-yellow-900' :
                        color.includes('red') ? 'bg-red-100 dark:bg-red-900' :
                        'bg-green-100 dark:bg-green-900'}`}>
        <Icon className={color} size={24} />
      </div>
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  </motion.div>
)

export default Dashboard