import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import AuthPage from './components/AuthPage'
import LandingPage from './components/LandingPage'
import Dock from './components/Dock'
import { Home, Map, BarChart3, User } from 'lucide-react'
import './App.css'

// Lazy load heavy components
const MapView = lazy(() => import('./components/MapView'))
const AnalyticsPage = lazy(() => import('./components/AnalyticsPage'))
const ProfilePage = lazy(() => import('./components/ProfilePage'))
const OnboardingScreen = lazy(() => import('./components/OnboardingScreen'))

// Loading fallback component
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  )
}

// Protected Route Component
function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

// Navigation Dock Component
function NavigationDock({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const items = [
    { 
      icon: <Home size={18} />, 
      label: 'Home', 
      onClick: () => navigate('/map') 
    },
    { 
      icon: <Map className='text-white' size={18} />, 
      label: 'Map', 
      onClick: () => navigate('/map') 
    },
    { 
      icon: <BarChart3 size={18} />, 
      label: 'Analytics', 
      onClick: () => navigate('/analytics') 
    },
    { 
      icon: <User size={18} />, 
      label: 'Profile', 
      onClick: () => navigate('/profile') 
    },
  ]

  return (
    <div className="dock-container">
      <Dock 
        items={items}
        panelHeight={60}
        baseItemSize={50}
        magnification={70}
      />
    </div>
  )
}

function App() {
  const [crimeData, setCrimeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState({
    hotspots: [],
    patterns: null,
    trends: null,
    patrolRoutes: []
  })
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState(new Set())
  const [lastFetchTime, setLastFetchTime] = useState(new Date().toISOString())
  
  // Authentication state
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  
  // Onboarding state
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const completedOnboarding = localStorage.getItem('onboardingCompleted')
    
    setHasCompletedOnboarding(completedOnboarding === 'true')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setAuthChecked(true)
  }, [])

  // Handle login
  const handleLogin = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    setIsAuthenticated(true)
    
    // Set axios default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  }

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true')
    setHasCompletedOnboarding(true)
  }

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true')
    setHasCompletedOnboarding(true)
  }

  // Handle reset onboarding
  const handleResetOnboarding = () => {
    localStorage.removeItem('onboardingCompleted')
    setHasCompletedOnboarding(false)
    setShowOnboarding(true)
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setIsAuthenticated(false)
    
    // Remove axios authorization header
    delete axios.defaults.headers.common['Authorization']
  }

  // Get unique crime types from data
  const availableCrimeTypes = useMemo(() => {
    const types = new Set()
    crimeData.forEach(crime => {
      if (crime.crime_type) {
        types.add(crime.crime_type.toLowerCase())
      }
    })
    return Array.from(types).sort()
  }, [crimeData])

  // Initialize selected crime types when data loads
  useEffect(() => {
    if (availableCrimeTypes.length > 0 && selectedCrimeTypes.size === 0) {
      setSelectedCrimeTypes(new Set(availableCrimeTypes))
    }
  }, [availableCrimeTypes])

  // Filter crime data based on selected types
  const filteredCrimeData = useMemo(() => {
    if (selectedCrimeTypes.size === 0) return crimeData
    return crimeData.filter(crime => 
      selectedCrimeTypes.has(crime.crime_type?.toLowerCase())
    )
  }, [crimeData, selectedCrimeTypes])

  // Toggle crime type selection
  const toggleCrimeType = (type) => {
    setSelectedCrimeTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  // Select all crime types
  const selectAllCrimeTypes = () => {
    setSelectedCrimeTypes(new Set(availableCrimeTypes))
  }

  // Deselect all crime types
  const deselectAllCrimeTypes = () => {
    setSelectedCrimeTypes(new Set())
  }

  const fetchAnalytics = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const [hotspotsRes, patternsRes, trendsRes, patrolRes] = await Promise.all([
        axios.get(`${API_URL}/api/analytics/hotspots`),
        axios.get(`${API_URL}/api/analytics/patterns`),
        axios.get(`${API_URL}/api/analytics/trends?days=30`),
        axios.get(`${API_URL}/api/analytics/patrol-routes?officers=5`)
      ])
      
      setAnalytics({
        hotspots: hotspotsRes.data.data || [],
        patterns: patternsRes.data.data || null,
        trends: trendsRes.data.data || null,
        patrolRoutes: patrolRes.data.data || []
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  // Fetch crime data function (moved outside useEffect to make it reusable)
  const fetchData = async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    
    try {
      console.log('Fetching crime data...')
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const [crimeResponse, statsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/crime-data`),
        axios.get(`${API_URL}/api/stats`)
      ])
      
      console.log('Crime data received:', crimeResponse.data.data.length, 'crimes')
      setCrimeData(crimeResponse.data.data)
      setStats(statsResponse.data)
      setLoading(false)
      
      // Fetch analytics after initial data load
      fetchAnalytics()
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set loading to false even on error so map can render
      setLoading(false)
    }
  }

  // Manual refresh handler
  const handleRefreshData = async () => {
    await fetchData()
  }

  // Only fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated && authChecked) {
      fetchData()
    }
  }, [isAuthenticated, authChecked])

  // Poll for new data every 60 seconds (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return
    
    const pollInterval = setInterval(async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const response = await axios.get(`${API_URL}/api/crime-data/new?since=${lastFetchTime}`)
        
        if (response.data.success && response.data.data.length > 0) {
          const newCrimes = response.data.data
          console.log(`🆕 Found ${newCrimes.length} new crime(s)`)
          
          setCrimeData(prev => [...newCrimes, ...prev])
          
          const statsResponse = await axios.get(`${API_URL}/api/stats`)
          setStats(statsResponse.data)
          
          fetchAnalytics()
          setLastFetchTime(response.data.timestamp)
        }
      } catch (error) {
        console.error('Error fetching new data:', error)
      }
    }, 60000) // 60 seconds

    return () => clearInterval(pollInterval)
  }, [lastFetchTime, isAuthenticated])

  // Don't render until auth is checked
  if (!authChecked) {
    return <LoadingScreen />
  }

  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                hasCompletedOnboarding ? <Navigate to="/map" replace /> : <Navigate to="/onboarding" replace />
              ) : (
                <LandingPage />
              )
            } 
          />
          <Route 
            path="/auth" 
            element={
              isAuthenticated ? (
                hasCompletedOnboarding ? <Navigate to="/map" replace /> : <Navigate to="/onboarding" replace />
              ) : (
                <AuthPage onLogin={handleLogin} />
              )
            } 
          />
          <Route 
            path="/login" 
            element={<Navigate to="/auth" replace />} 
          />
          <Route 
            path="/signup" 
            element={<Navigate to="/auth" replace />} 
          />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <OnboardingScreen 
                  onComplete={handleOnboardingComplete}
                  onSkip={handleOnboardingSkip}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/map" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <MapView 
                  crimeData={crimeData}
                  stats={stats}
                  loading={loading}
                  selectedCrimeTypes={selectedCrimeTypes}
                  availableCrimeTypes={availableCrimeTypes}
                  toggleCrimeType={toggleCrimeType}
                  selectAllCrimeTypes={selectAllCrimeTypes}
                  deselectAllCrimeTypes={deselectAllCrimeTypes}
                  onRefresh={handleRefreshData}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AnalyticsPage 
                  crimeData={crimeData}
                  analytics={analytics}
                  filteredCrimeData={filteredCrimeData}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ProfilePage 
                  user={user}
                  onLogout={handleLogout}
                  onResetOnboarding={handleResetOnboarding}
                />
              </ProtectedRoute>
            } 
          />
        </Routes>
        {isAuthenticated && hasCompletedOnboarding && <NavigationDock onLogout={handleLogout} />}
      </Suspense>
    </Router>
  )
}

export default App