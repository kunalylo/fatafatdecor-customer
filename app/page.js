'use client'

import { Component } from 'react'
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

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.error('[FatafatDecor] Crash:', error, info?.componentStack) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-400 mb-6">The app encountered an unexpected error.</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            className="px-6 py-3 gradient-pink text-white font-bold rounded-2xl shadow-pink">
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const { screen, user, mounted } = useApp()
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
      {user && screen !== SCREENS.AUTH && screen !== SCREENS.GENERATING && screen !== SCREENS.ADDRESS && screen !== SCREENS.GIFT_BOOKING && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  )
}
