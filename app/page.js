'use client'

import { AppProvider } from './context/AppContext'
import { useApp } from './context/AppContext'
import { SCREENS } from './lib/constants'
import Toast from './components/Toast'
import BottomNav from './components/BottomNav'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import UploadScreen from './screens/UploadScreen'
import GeneratingScreen from './screens/GeneratingScreen'
import DesignScreen from './screens/DesignScreen'
import BookingScreen from './screens/BookingScreen'
import TrackingScreen from './screens/TrackingScreen'
import CreditsScreen from './screens/CreditsScreen'
import OrdersScreen from './screens/OrdersScreen'
import OrderDetailScreen from './screens/OrderDetailScreen'
import ProfileScreen from './screens/ProfileScreen'

function AppContent() {
  const { screen, user } = useApp()
  return (
    <div className="min-h-screen bg-white max-w-md mx-auto relative overflow-hidden">
      <Toast />
      {screen === SCREENS.AUTH && <AuthScreen />}
      {screen === SCREENS.HOME && <HomeScreen />}
      {screen === SCREENS.UPLOAD && <UploadScreen />}
      {screen === SCREENS.GENERATING && <GeneratingScreen />}
      {screen === SCREENS.DESIGN && <DesignScreen />}
      {screen === SCREENS.BOOKING && <BookingScreen />}
      {screen === SCREENS.TRACKING && <TrackingScreen />}
      {screen === SCREENS.CREDITS && <CreditsScreen />}
      {screen === SCREENS.ORDERS && <OrdersScreen />}
      {screen === SCREENS.ORDER_DETAIL && <OrderDetailScreen />}
      {screen === SCREENS.PROFILE && <ProfileScreen />}
      {user && screen !== SCREENS.AUTH && screen !== SCREENS.GENERATING && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
