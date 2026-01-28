import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import TopBar from './components/TopBar'
import ProfilePage from './components/ProfilePage'

function App() {
  const [isDark, setIsDark] = useState(false)
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
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
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
    setActivePage('profile')
  }

  const handleSaveProfile = (updatedProfile) => {
    setUserProfile(updatedProfile)
    console.log('Profile saved:', updatedProfile)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onViewProfile={handleViewProfile}
          googleUser={googleUser} 
          onNavigate={setActivePage} // UPDATED: Pass navigation handler
          activePage={activePage}    // Optional: Pass active state to highlight button
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar 
            isDark={isDark} 
            onThemeToggle={() => setIsDark(!isDark)} 
            googleUser={googleUser}
            onLoginSuccess={handleLogin}
            onLogout={handleLogout}
          />
          
          {activePage === 'home' && (
            <MainContent sidebarCollapsed={sidebarCollapsed} userProfile={userProfile} />
          )}
          {activePage === 'profile' && (
            <ProfilePage 
              userProfile={userProfile}
              onSave={handleSaveProfile}
              onBack={() => setActivePage('home')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App