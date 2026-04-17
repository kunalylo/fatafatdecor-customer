'use client'

import { Home, ShoppingBag, Camera, MapPin, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function BottomNav() {
  const { screen, setSelectedOrder, setTrackingData, navigate } = useApp()

  const leftItems = [
    { screen: SCREENS.HOME,   icon: Home,        label: 'Home'    },
    { screen: SCREENS.ORDERS, icon: ShoppingBag,  label: 'Orders'  },
  ]
  const rightItems = [
    { screen: SCREENS.TRACKING, icon: MapPin, label: 'Track'   },
    { screen: SCREENS.PROFILE,  icon: User,   label: 'Profile' },
  ]

  const goTo = (s) => {
    if (s !== SCREENS.TRACKING && screen !== s) {
      setSelectedOrder(null)
      setTrackingData(null)
    }
    if (screen !== s) navigate(s)
  }

  const itemClass = (s) =>
    `flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
      screen === s ? 'text-pink-500' : 'text-gray-400'
    }`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto relative">

        {/* ── Floating center FAB ── */}
        <button
          onClick={() => goTo(SCREENS.UPLOAD)}
          className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 focus:outline-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="w-14 h-14 gradient-pink rounded-2xl flex items-center justify-center shadow-lg shadow-pink-300/50">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <span className={`text-[10px] font-semibold ${screen === SCREENS.UPLOAD ? 'text-pink-500' : 'text-gray-400'}`}>
            Create
          </span>
        </button>

        {/* ── Nav bar ── */}
        <div className="bg-white border-t border-gray-100 shadow-lg">
          <div className="flex items-center justify-around px-2 pt-2 pb-2">

            {leftItems.map(item => (
              <button key={item.label} onClick={() => goTo(item.screen)} className={itemClass(item.screen)}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}

            {/* Spacer for centre FAB */}
            <div className="w-16" />

            {rightItems.map(item => (
              <button key={item.label} onClick={() => goTo(item.screen)} className={itemClass(item.screen)}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}

          </div>
        </div>
      </div>
    </div>
  )
}
