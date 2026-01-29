import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAppContext } from './context/AppContext'
import { ChatContextProvider } from './context/ChatContext'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import TopBar from './components/TopBar'
import ProfilePage from './components/ProfilePage'
import Profile from './components/Profile'
import Dashboard from './components/Dashboard'
import PlatformOnboarding from './components/PlatformOnboarding'
import Home from './components/Home'
import ChatSidebar from './components/ChatSidebar'
import ChatGPTInterface from './components/ChatGPTInterface'

function App() {
  const { sessionId, setSessionId } = useAppContext()
  const navigate = useNavigate()
  
  const [isDark, setIsDark] = useState(() => {
    // Check if user has a saved theme preference, default to dark if not found
    const savedTheme = localStorage.getItem('theme')
    return savedTheme ? savedTheme === 'dark' : true // Default to dark theme
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('home')
  
  const [googleUser, setGoogleUser] = useState(null)

  const [userProfile, setUserProfile] = useState({
    businessOwnerName: 'Rajesh Kumar',
    businessName: 'Kumar Textiles Pvt. Ltd.',
    businessType: 'Textile',
    msmeCategory: 'Small',
    city: 'Surat',
    state: 'Gujarat',
    email: 'rajesh@kumartextiles.com',
    mobileNumber: '+91 98765 43210',
    gstNumber: '24AABCU9603R1ZX',
    registrationDate: '2020-03-15',
    picture: '' // Initialize picture field
  })

  useEffect(() => {
    // Apply theme class to document
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleLogin = (userData) => {
    setGoogleUser(userData);

    setUserProfile({
      businessOwnerName: userData.name,
      businessName: '',
      businessType: '',
      msmeCategory: '',
      city: '',
      state: '',
      email: userData.email,
      mobileNumber: '',
      gstNumber: '',
      registrationDate: '',
      picture: userData.picture // UPDATED: Save the Google picture URL
    });
  }

  const handleLogout = () => {
    setGoogleUser(null)
    setActivePage('home')
  }

  const handleViewProfile = () => {
    navigate('/profile')
  }

  const handleNavigate = (page) => {
    if (page === 'home') {
      navigate('/')
    } else if (page === 'dashboard') {
      navigate('/dashboard')
    } else if (page === 'chat') {
      navigate('/chat')
    }
    setActivePage(page)
  }

  const handleSaveProfile = (updatedProfile) => {
    setUserProfile(updatedProfile)
    console.log('Profile saved:', updatedProfile)
  }

  return (
    <ChatContextProvider>
      <div className={`min-h-screen ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onViewProfile={handleViewProfile}
            googleUser={googleUser} 
            onNavigate={handleNavigate} // UPDATED: Pass navigation handler
            activePage={activePage}     // Optional: Pass active state to highlight button
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar 
              isDark={isDark} 
              onThemeToggle={() => setIsDark(!isDark)} 
              googleUser={googleUser}
              onLoginSuccess={handleLogin}
              onLogout={handleLogout}
            />
          
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  sidebarCollapsed={sidebarCollapsed} 
                  userProfile={userProfile} 
                  onSessionUpdate={setSessionId}
                />
              } 
            />
            <Route 
              path="/chat" 
              element={
                <div className="relative h-screen overflow-hidden">
                  <ChatSidebar />
                  <ChatGPTInterface userProfile={userProfile} />
                </div>
              } 
            />
            <Route 
              path="/old-chat" 
              element={
                <MainContent 
                  sidebarCollapsed={sidebarCollapsed} 
                  userProfile={userProfile} 
                  onSessionUpdate={setSessionId}
                />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  userProfile={userProfile} 
                  sessionId={sessionId}
                />
              } 
            />
            <Route 
              path="/platforms" 
              element={<PlatformOnboarding />} 
            />
            <Route 
              path="/profile" 
              element={
                <Profile 
                  googleUser={googleUser}
                  userProfile={userProfile}
                />
              } 
            />
            <Route 
              path="/profile-old" 
              element={
                <ProfilePage 
                  userProfile={userProfile}
                  onSave={handleSaveProfile}
                  onBack={() => navigate('/')}
                />
              } 
            />
          </Routes>
        </div>
      </div>
    </div>
    </ChatContextProvider>
  )
}

export default App