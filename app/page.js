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
import AddressScreen from './screens/AddressScreen'
import GiftsScreen from './screens/GiftsScreen'
import GiftBookingScreen from './screens/GiftBookingScreen'

function AppContent() {
  const { screen, user, mounted } = useApp()
  // Don't render any screen until after hydration — prevents React #418 mismatch
  if (!mounted) return <div className="min-h-screen bg-white" />
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
      {screen === SCREENS.ADDRESS && <AddressScreen />}
      {screen === SCREENS.GIFTS && <GiftsScreen />}
      {screen === SCREENS.GIFT_BOOKING && <GiftBookingScreen />}
      {user && screen !== SCREENS.AUTH && screen !== SCREENS.GENERATING && screen !== SCREENS.ADDRESS && <BottomNav />}
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
