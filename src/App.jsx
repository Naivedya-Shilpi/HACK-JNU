import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import TopBar from './components/TopBar'

function App() {
  const [isDark, setIsDark] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar isDark={isDark} onThemeToggle={() => setIsDark(!isDark)} />
          <MainContent />
        </div>
      </div>
    </div>
  )
}

export default App
