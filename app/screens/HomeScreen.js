'use client'

import { useEffect } from 'react'
import {
  Settings, Zap, ArrowRight, Image as ImageIcon, Package, IndianRupee, Sparkles,
  Truck, MapPin, ChevronDown, ChevronRight, Loader2, Camera, Gift, Cake, Heart,
  Gem, Baby, Home as HomeIcon, PartyPopper, Wine, ShieldCheck, Star, BadgeCheck, Wand2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, LOGO_URL } from '../lib/constants'

const OCCASIONS = [
  { icon: Cake,        label: 'Birthday',     accent: 'accent-pink'     },
  { icon: Heart,       label: 'Anniversary',  accent: 'accent-peach'    },
  { icon: Gem,         label: 'Engagement',   accent: 'accent-lavender' },
  { icon: Baby,        label: 'Baby Shower',  accent: 'accent-mint'     },
  { icon: HomeIcon,    label: 'Housewarming', accent: 'accent-peach'    },
  { icon: PartyPopper, label: 'Party',        accent: 'accent-pink'     },
  { icon: Sparkles,    label: 'Festival',     accent: 'accent-lavender' },
  { icon: Wine,        label: 'Dinner',       accent: 'accent-peach'    },
]

const STEPS = [
  { step: '01', title: 'Capture your space', desc: 'Take a photo of the room you want decorated', icon: Camera },
  { step: '02', title: 'AI decorates it',    desc: 'AI adds beautiful decor to your actual photo', icon: Wand2 },
  { step: '03', title: 'Decorator arrives',  desc: 'A verified decorator sets it all up at home',  icon: Truck },
]

const TRUST = [
  { icon: ShieldCheck, label: 'Secure Payment' },
  { icon: Star,        label: 'Top Decorators' },
  { icon: BadgeCheck,  label: 'Verified Service' },
]

export default function HomeScreen() {
  const {
    user, designs, orders, navigate, setSelectedDesign,
    userAddress, locationLoading, locationDenied, detectLocation,
    setGiftMode, setGiftCart, gifts, loadGifts,
  } = useApp()

  useEffect(() => { if (gifts.length === 0) loadGifts() }, [])

  const locationTop = () => {
    if (userAddress?.flat && userAddress?.area) return `${userAddress.flat}, ${userAddress.area}`
    if (userAddress?.flat && userAddress?.city) return `${userAddress.flat}, ${userAddress.city}`
    if (userAddress?.area) return userAddress.area
    if (userAddress?.city) return userAddress.city
    return null
  }

  const locationSub = () => {
    if (userAddress?.flat) return [userAddress.city, userAddress.pincode].filter(Boolean).join(' - ')
    if (userAddress?.city) return 'Tap to add flat / building'
    return null
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
  <div className="slide-up pb-28 bg-aurora min-h-screen relative overflow-hidden">
    {/* Ambient orbs */}
    <div className="iridescent-orb absolute -top-12 -right-10 w-44 h-44 rounded-full pointer-events-none" />
    <div className="iridescent-orb absolute top-72 -left-12 w-40 h-40 rounded-full pointer-events-none" style={{ animationDelay: '3s' }} />

    <div className="relative z-10 px-4 pt-12">

      {/* ── Location bar ── */}
      <div className="flex items-center gap-1.5 mb-4">
        <button onClick={() => detectLocation(user?.id)} className="shrink-0 p-1">
          {locationLoading
            ? <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
            : <MapPin className={`w-4 h-4 ${locationDenied ? 'text-red-400' : 'text-pink-500'}`} />}
        </button>
        <button onClick={() => navigate(SCREENS.ADDRESS)} className="flex-1 min-w-0 text-left glass-card rounded-2xl px-3 py-2">
          {locationDenied ? (
            <span className="text-red-500 text-xs font-medium">Location blocked — tap GPS to retry</span>
          ) : locationTop() ? (
            <>
              <p className="text-gray-900 font-bold text-sm leading-tight truncate">{locationTop()}</p>
              {locationSub() && <p className="text-gray-500 text-xs truncate">{locationSub()}</p>}
            </>
          ) : locationLoading ? (
            <span className="text-gray-500 text-xs">Detecting location…</span>
          ) : (
            <span className="text-gray-500 text-xs">Tap to set your delivery location</span>
          )}
        </button>
        <button onClick={() => navigate(SCREENS.ADDRESS)} className="shrink-0">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* ── Greeting row ── */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/70 shadow glass-icon">
            <img src={LOGO_URL} alt="FatafatDecor" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-gray-500 text-xs">{greeting}</p>
            <h1 className="font-display text-2xl text-gray-900 leading-tight truncate">{user?.name?.split(' ')[0] || 'there'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate(SCREENS.CREDITS)} className="glass-card rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-gray-900 font-bold text-sm">{user?.credits || 0}</span>
            <span className="text-gray-400 text-xs">credits</span>
          </button>
          {user?.role === 'admin' && (
            <a href="/admin" className="glass-card rounded-full p-2.5 flex items-center justify-center">
              <Settings className="w-4 h-4 text-gray-700" />
            </a>
          )}
        </div>
      </div>

      {/* ── Hero Decorate CTA ── */}
      <button onClick={() => navigate(SCREENS.UPLOAD)}
        className="w-full text-left glass-floating rounded-[26px] p-4 flex items-center gap-4 hover:scale-[1.01] transition-transform mb-3">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-2xl iridescent blur-md opacity-60" />
          <div className="relative w-14 h-14 iridescent aurora-shimmer rounded-2xl flex items-center justify-center border border-white/60">
            <Sparkles className="w-7 h-7 text-white drop-shadow" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="eyebrow text-pink-500/80 mb-0.5">AI Studio</p>
          <h3 className="font-display text-xl text-gray-900 leading-tight">Decorate my <span className="italic iridescent-text">space</span></h3>
          <p className="text-gray-500 text-xs mt-0.5">Photo → AI design → decorator delivers</p>
        </div>
        <div className="w-9 h-9 btn-primary-luxury rounded-full flex items-center justify-center shrink-0">
          <ArrowRight className="w-4 h-4 text-white" />
        </div>
      </button>

      {/* ── Gifts banner ── */}
      <button onClick={() => { setGiftMode('standalone'); navigate(SCREENS.GIFTS) }}
        className="w-full text-left glass-warm rounded-[22px] p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform mb-3">
        <div className="w-11 h-11 accent-pink rounded-2xl flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">Send gifts &amp; flowers</p>
          <p className="text-xs text-gray-500 truncate">Same-day delivery — surprise your loved ones</p>
        </div>
        <ChevronRight className="w-4 h-4 text-pink-400 shrink-0" />
      </button>

      {/* Featured gifts horizontal scroll */}
      {gifts.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {gifts.slice(0, 6).map(gift => {
            const imgUrl = (gift.images?.[0] || gift.image_url || '')
            const src = imgUrl?.includes('ik.imagekit.io') ? `${imgUrl}?tr=w-280,h-200,q-80,c-maintain_ratio` : imgUrl
            return (
              <div key={gift.id} onClick={() => { setGiftMode('standalone'); navigate(SCREENS.GIFTS) }}
                className="shrink-0 w-32 glass-floating rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="w-full h-24 bg-pink-50/50 relative">
                  {src ? <img src={src} alt={gift.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Gift className="w-7 h-7 text-pink-300" /></div>}
                  <span className="absolute bottom-1.5 right-1.5 bg-white/95 text-pink-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">Rs {gift.price?.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-bold text-gray-800 line-clamp-1">{gift.name}</p>
                  {gift.occasion && <p className="text-[9px] text-gray-400 mt-0.5">{gift.occasion}</p>}
                </div>
              </div>
            )
          })}
          <div onClick={() => { setGiftMode('standalone'); navigate(SCREENS.GIFTS) }}
            className="shrink-0 w-24 glass-card rounded-2xl border-2 border-dashed border-pink-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-pink-400 transition-all">
            <Gift className="w-5 h-5 text-pink-400" />
            <span className="text-[10px] font-bold text-pink-500">View All</span>
          </div>
        </div>
      )}

      {/* ── Occasions ── */}
      <h2 className="font-display text-xl text-gray-900 mt-6 mb-3">Popular <span className="italic iridescent-text">occasions</span></h2>
      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {OCCASIONS.map((o, i) => (
          <button key={i} onClick={() => navigate(SCREENS.UPLOAD)}
            className="shrink-0 flex flex-col items-center gap-1.5 glass-card rounded-2xl px-4 py-3 hover:scale-[1.04] transition-all">
            <span className={`w-9 h-9 ${o.accent} rounded-xl flex items-center justify-center`}>
              <o.icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </span>
            <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap">{o.label}</span>
          </button>
        ))}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { label: 'Credits', value: user?.credits || 0, icon: Zap,      accent: 'accent-peach',    screen: SCREENS.CREDITS },
          { label: 'Designs', value: designs.length,      icon: ImageIcon, accent: 'accent-pink',     screen: null },
          { label: 'Orders',  value: orders.length,       icon: Package,  accent: 'accent-lavender', screen: SCREENS.ORDERS },
        ].map((s, i) => (
          <button key={i} onClick={() => s.screen && navigate(s.screen)} className="glass-floating rounded-2xl p-3 text-center hover:scale-[1.02] transition-transform">
            <div className={`w-9 h-9 ${s.accent} rounded-xl flex items-center justify-center mx-auto mb-1.5`}>
              <s.icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <p className="text-lg font-black text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      {/* ── Recent Designs ── */}
      {designs.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-gray-900">Recent <span className="italic iridescent-text">designs</span></h2>
            <button onClick={() => navigate(SCREENS.ORDERS)} className="text-xs text-pink-500 font-bold">See all →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
            {designs.slice(0, 5).map(d => (
              <div key={d.id} className="glass-floating rounded-2xl shrink-0 w-44 cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden"
                onClick={() => { setSelectedDesign(d); navigate(SCREENS.DESIGN) }}>
                {d.decorated_image ? (
                  <img
                    src={d.decorated_image.includes('ik.imagekit.io') ? `${d.decorated_image}?tr=w-352,h-224,q-75,c-maintain_ratio` : d.decorated_image}
                    alt="Design" className="w-full h-28 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-28 bg-pink-50/50 flex items-center justify-center"><Sparkles className="w-7 h-7 text-pink-300" /></div>
                )}
                <div className="p-2.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${d.status === 'ordered' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-600'}`}>
                    {d.status === 'ordered' ? 'ORDERED' : 'READY'}
                  </span>
                  <p className="text-xs font-bold text-gray-700 mt-1">{d.occasion?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                  <p className="text-[10px] text-gray-400">{d.room_type}</p>
                  <div className="flex items-center mt-1">
                    <IndianRupee className="w-3 h-3 text-pink-500" />
                    <span className="text-xs font-black text-pink-500">{d.total_cost?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => navigate(SCREENS.UPLOAD)}
              className="shrink-0 w-36 h-[164px] border-2 border-dashed border-pink-200 rounded-2xl glass-card flex flex-col items-center justify-center gap-2 hover:border-pink-400 transition-all hover:scale-[1.02]">
              <Sparkles className="w-7 h-7 text-pink-400" />
              <span className="text-xs font-bold text-pink-500">New Design</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {designs.length === 0 && (
        <div className="mt-6 p-6 glass-floating rounded-[24px] text-center">
          <div className="w-14 h-14 iridescent aurora-shimmer rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/60">
            <Wand2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-display text-xl text-gray-900 mb-1">No designs yet</h3>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">Upload a room photo and let AI create a stunning decoration plan for you</p>
          <button onClick={() => navigate(SCREENS.UPLOAD)}
            className="btn-primary-luxury text-white font-bold text-sm px-6 py-3 rounded-2xl">
            Create your first design
          </button>
        </div>
      )}

      {/* ── How It Works ── */}
      <h2 className="font-display text-xl text-gray-900 mt-7 mb-4">How it <span className="italic iridescent-text">works</span></h2>
      <div className="space-y-3">
        {STEPS.map(s => (
          <div key={s.step} className="flex items-center gap-4 glass-card rounded-2xl p-4">
            <div className="w-12 h-12 iridescent rounded-2xl flex items-center justify-center shrink-0 border border-white/60">
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="eyebrow text-pink-400 mb-0.5">Step {s.step}</div>
              <p className="text-sm font-bold text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Trust badges ── */}
      <div className="flex gap-2 mt-5">
        {TRUST.map((t, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1 glass-card rounded-2xl py-3">
            <t.icon className="w-4 h-4 text-pink-500" />
            <span className="text-[10px] font-bold text-gray-600 text-center">{t.label}</span>
          </div>
        ))}
      </div>

    </div>
  </div>
  )
}
