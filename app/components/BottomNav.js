'use client'

import { Home, Gift, Sparkles, Package, User } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

// Sequence: Home → Gifts → Decorate (centered, primary) → Orders → Profile
const ITEMS = [
  { id: 'home',     label: 'Home',     icon: Home,     screen: SCREENS.HOME },
  { id: 'gifts',    label: 'Gifts',    icon: Gift,     screen: SCREENS.GIFTS },
  { id: 'decorate', label: 'Decorate', icon: Sparkles, screen: SCREENS.UPLOAD, isPrimary: true },
  { id: 'orders',   label: 'Orders',   icon: Package,  screen: SCREENS.ORDERS },
  { id: 'profile',  label: 'Profile',  icon: User,     screen: SCREENS.PROFILE },
]

// Map the current screen to an active tab id
const matchTab = (s) => {
  if (s === SCREENS.HOME) return 'home'
  if (s === SCREENS.GIFTS || s === SCREENS.GIFT_BOOKING) return 'gifts'
  if (s === SCREENS.UPLOAD || s === SCREENS.GENERATING || s === SCREENS.DESIGN) return 'decorate'
  if (s === SCREENS.ORDERS || s === SCREENS.ORDER_DETAIL || s === SCREENS.TRACKING || s === SCREENS.BOOKING) return 'orders'
  if (s === SCREENS.PROFILE || s === SCREENS.ADDRESS || s === SCREENS.CREDITS) return 'profile'
  return null
}

export default function BottomNav() {
  const { screen, setSelectedOrder, setTrackingData, navigate } = useApp()
  const active = matchTab(screen)

  const goTo = (s) => {
    if (s !== SCREENS.TRACKING && screen !== s) {
      setSelectedOrder(null)
      setTrackingData(null)
    }
    if (screen !== s) navigate(s)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" style={{ pointerEvents: 'none' }}>
      <div className="max-w-md mx-auto" style={{ pointerEvents: 'auto' }}>
        <div className="glass-luxury" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
          <div className="px-4 pt-2.5 pb-2">
            <div className="flex items-end justify-between">

              {ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = active === item.id

                // ── Centered Decorate button ──
                if (item.isPrimary) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(item.screen)}
                      aria-label={item.label}
                      className="relative flex flex-col items-center -mt-9 w-20 focus:outline-none active:scale-95 transition-transform"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {/* Outer ambient ring */}
                      <div
                        className="absolute -inset-3 rounded-full nav-ambient pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(255,138,176,0.35), rgba(184,154,255,0.18) 60%, transparent 80%)', filter: 'blur(14px)' }}
                      />
                      {/* Iridescent halo */}
                      <div className="absolute -inset-2 rounded-[28px] iridescent nav-halo blur-xl -z-10 pointer-events-none" />

                      {/* Orbiting sparkle particles */}
                      <div className="absolute top-1/2 left-1/2 nav-orbit-cw pointer-events-none" style={{ width: 0, height: 0 }}>
                        <div style={{ position: 'absolute', transform: 'translate(40px, -2px)' }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white sparkle-twinkle" style={{ boxShadow: '0 0 6px rgba(255,255,255,0.9)' }} />
                        </div>
                      </div>
                      <div className="absolute top-1/2 left-1/2 nav-orbit-ccw pointer-events-none" style={{ width: 0, height: 0 }}>
                        <div style={{ position: 'absolute', transform: 'translate(-42px, 4px)' }}>
                          <div className="w-1 h-1 rounded-full sparkle-twinkle" style={{ background: '#fbcfe8', boxShadow: '0 0 5px rgba(255,182,193,0.9)' }} />
                        </div>
                      </div>

                      {/* The big iridescent button */}
                      <div
                        className="relative w-[68px] h-[68px] rounded-[22px] iridescent aurora-shimmer flex items-center justify-center"
                        style={{
                          boxShadow: isActive
                            ? '0 18px 44px -10px rgba(232, 130, 175, 0.65), 0 6px 18px -4px rgba(184, 154, 255, 0.45), inset 0 2px 4px rgba(255,255,255,0.4)'
                            : '0 14px 32px -10px rgba(232, 130, 175, 0.5), inset 0 2px 4px rgba(255,255,255,0.35)'
                        }}
                      >
                        {/* Inner specular highlight */}
                        <div
                          className="absolute inset-0 rounded-[22px] overflow-hidden pointer-events-none"
                          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)' }}
                        />
                        <Sparkles className={`w-7 h-7 text-white relative z-10 ${isActive ? 'spin-slow' : ''}`} strokeWidth={2.2} />
                      </div>

                      <span className={`text-[10px] font-bold mt-1.5 tracking-wide transition-colors ${isActive ? 'text-pink-700' : 'text-gray-700'}`}>
                        {item.label}
                      </span>
                    </button>
                  )
                }

                // ── Side tabs ──
                return (
                  <button
                    key={item.id}
                    onClick={() => goTo(item.screen)}
                    aria-label={item.label}
                    className="relative flex flex-col items-center gap-1 py-1.5 w-14 focus:outline-none active:scale-90 transition-transform"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {/* Active glass pill */}
                    {isActive && (
                      <div
                        className="absolute inset-x-1 top-0.5 bottom-0.5 rounded-2xl"
                        style={{
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))',
                          boxShadow: '0 4px 14px -6px rgba(60, 30, 90, 0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.5)'
                        }}
                      />
                    )}

                    <div className="relative w-9 h-9 rounded-xl flex items-center justify-center z-10">
                      <Icon
                        className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
                        strokeWidth={isActive ? 2.4 : 2.1}
                      />
                    </div>
                    <span className={`text-[10px] relative z-10 transition-colors ${isActive ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}>
                      {item.label}
                    </span>

                    {isActive && (
                      <div className="absolute -bottom-0.5 w-1 h-1 rounded-full iridescent" />
                    )}
                  </button>
                )
              })}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
