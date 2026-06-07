'use client'

import { Home, Gift, Sparkles, Package, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function BottomNav() {
  const { screen, setSelectedOrder, setTrackingData, navigate } = useApp()

  const goTo = (s) => {
    if (s !== SCREENS.TRACKING && screen !== s) {
      setSelectedOrder(null)
      setTrackingData(null)
    }
    if (screen !== s) navigate(s)
  }

  // Aurora bottom nav — order is fixed: Home, Gifts, Decorate(center), Orders, Profile
  const leftItems = [
    { screen: SCREENS.HOME,  icon: Home, label: 'Home'  },
    { screen: SCREENS.GIFTS, icon: Gift, label: 'Gifts' },
  ]
  const rightItems = [
    { screen: SCREENS.ORDERS,  icon: Package, label: 'Orders'  },
    { screen: SCREENS.PROFILE, icon: User,    label: 'Profile' },
  ]

  const isActive = (s) => screen === s
  const tabClass = (s) =>
    `flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all ${
      isActive(s) ? 'text-pink-600' : 'text-gray-400'
    }`

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto relative">

        {/* ── Centered Decorate FAB (oversized, iridescent) ── */}
        <button
          onClick={() => goTo(SCREENS.UPLOAD)}
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 focus:outline-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-[22px] iridescent blur-md opacity-70 premium-pulse" />
            <div className="relative w-[68px] h-[68px] iridescent aurora-shimmer rounded-[22px] flex items-center justify-center shadow-xl border border-white/60">
              <Sparkles className="w-8 h-8 text-white drop-shadow" />
            </div>
          </div>
          <span className={`text-[10px] font-bold tracking-wide ${isActive(SCREENS.UPLOAD) ? 'text-pink-600' : 'text-gray-500'}`}>
            Decorate
          </span>
        </button>

        {/* ── Glass nav bar ── */}
        <div className="glass-luxury">
          <div className="flex items-center justify-around px-2 pt-2.5 pb-2">

            {leftItems.map(item => (
              <button key={item.label} onClick={() => goTo(item.screen)} className={tabClass(item.screen)}>
                <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive(item.screen) ? 2.4 : 2} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            ))}

            {/* Spacer for centre FAB */}
            <div className="w-16" />

            {rightItems.map(item => (
              <button key={item.label} onClick={() => goTo(item.screen)} className={tabClass(item.screen)}>
                <item.icon className="w-[22px] h-[22px]" strokeWidth={isActive(item.screen) ? 2.4 : 2} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            ))}

          </div>
        </div>
      </div>
    </div>
  )
}
