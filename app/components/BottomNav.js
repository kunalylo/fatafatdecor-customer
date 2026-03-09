'use client'

import { Home, ShoppingBag, Camera, MapPin, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function BottomNav() {
  const { screen, setSelectedOrder, setTrackingData, navigate } = useApp()
  const navItems = [
    { screen: SCREENS.HOME, icon: Home, label: 'Home' },
    { screen: SCREENS.ORDERS, icon: ShoppingBag, label: 'Orders' },
    { screen: SCREENS.UPLOAD, icon: Camera, label: 'Create', center: true },
    { screen: SCREENS.TRACKING, icon: MapPin, label: 'Track' },
    { screen: SCREENS.PROFILE, icon: User, label: 'Profile' }
  ]
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map(item => (
            <button key={item.label} onClick={() => { setSelectedOrder(null); setTrackingData(null); navigate(item.screen) }}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${screen === item.screen ? 'text-pink-500' : 'text-gray-400'}`}>
              {item.center ? (
                <div className="w-12 h-12 gradient-pink rounded-2xl flex items-center justify-center -mt-5 shadow-lg shadow-pink-300/40">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <item.icon className="w-5 h-5" />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
