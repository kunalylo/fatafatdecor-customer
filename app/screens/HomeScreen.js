'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Settings, Zap, Camera, ArrowRight, ImageIcon, Package, IndianRupee, Sparkles, Truck, MapPin, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, LOGO_URL } from '../lib/constants'

const OCCASIONS = [
  { icon: '🎂', label: 'Birthday' },
  { icon: '💑', label: 'Anniversary' },
  { icon: '💍', label: 'Engagement' },
  { icon: '👶', label: 'Baby Shower' },
  { icon: '🏡', label: 'Housewarming' },
  { icon: '🥳', label: 'Party' },
  { icon: '🪔', label: 'Festival' },
  { icon: '🍷', label: 'Dinner' },
]

export default function HomeScreen() {
  const {
    user, designs, orders, navigate, setSelectedDesign,
    userAddress, locationLoading, locationDenied, detectLocation,
    setGiftMode, setGiftCart,
  } = useApp()

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

  return (
  <div className="slide-up pb-24 bg-rose-50 min-h-screen">

    {/* ── Pink header ── */}
    <div className="gradient-pink p-6 pb-14 rounded-b-3xl relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Location bar */}
      <div className="flex items-center gap-1.5 mb-4 max-w-full">
        <button onClick={() => detectLocation(user?.id)} className="shrink-0 p-1">
          {locationLoading
            ? <Loader2 className="w-4 h-4 text-yellow-200 animate-spin" />
            : <MapPin className={`w-4 h-4 ${locationDenied ? 'text-red-300' : 'text-yellow-200'}`} />}
        </button>
        <button onClick={() => navigate(SCREENS.ADDRESS)} className="flex-1 min-w-0 text-left bg-white/15 rounded-xl px-3 py-2">
          {locationDenied ? (
            <span className="text-red-200 text-xs font-medium">Location blocked — tap GPS to retry</span>
          ) : locationTop() ? (
            <>
              <p className="text-white font-bold text-sm leading-tight truncate">{locationTop()}</p>
              {locationSub() && <p className="text-white/70 text-xs truncate">{locationSub()}</p>}
            </>
          ) : locationLoading ? (
            <span className="text-white/70 text-xs">Detecting location…</span>
          ) : (
            <span className="text-white/70 text-xs">📍 Tap to set your delivery location</span>
          )}
        </button>
        <button onClick={() => navigate(SCREENS.ADDRESS)} className="shrink-0">
          <ChevronDown className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-white/40 shadow-lg">
            <img src={LOGO_URL} alt="FatafatDecor" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white/70 text-xs">
              {new Date().getHours() < 12 ? '🌅 Good morning' : new Date().getHours() < 17 ? '☀️ Good afternoon' : '🌙 Good evening'}
            </p>
            <h1 className="text-white text-xl font-black">{user?.name?.split(' ')[0] || 'there'} 👋</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(SCREENS.CREDITS)} className="bg-white/20 rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-white/20">
            <Zap className="w-4 h-4 text-yellow-200" />
            <span className="text-white font-black text-sm">{user?.credits || 0}</span>
            <span className="text-white/60 text-xs">credits</span>
          </button>
          {user?.role === 'admin' && (
            <a href="/admin" className="bg-white/20 rounded-full p-2 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </a>
          )}
        </div>
      </div>
    </div>

    {/* ── Main CTA card — overlaps header ── */}
    <div className="px-4 -mt-9">
      <Card className="border-0 shadow-xl shadow-pink-200/40 cursor-pointer hover:scale-[1.01] transition-transform bg-white rounded-2xl" onClick={() => navigate(SCREENS.UPLOAD)}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-14 h-14 gradient-pink rounded-2xl flex items-center justify-center shrink-0 shadow-pink text-2xl">
            🎀
          </div>
          <div className="flex-1">
            <h3 className="font-black text-gray-800">✨ Decorate My Space</h3>
            <p className="text-gray-400 text-xs mt-0.5">Photo → AI Design → Decorator delivers 🚚</p>
          </div>
          <div className="w-8 h-8 gradient-pink rounded-full flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* ── Gifts banner ── */}
    <div onClick={() => { setGiftMode('standalone'); setGiftCart([]); navigate(SCREENS.GIFTS) }}
      className="mx-4 mt-3 p-4 bg-white rounded-2xl border border-pink-100 shadow-sm flex items-center gap-3 cursor-pointer hover:scale-[1.01] transition-transform">
      <div className="w-11 h-11 bg-pink-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-pink-100">🎁</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm">Send Gifts</p>
        <p className="text-xs text-gray-500 truncate">Bouquets, flowers & arrangements — delivered</p>
      </div>
      <ChevronRight className="w-4 h-4 text-pink-400 flex-shrink-0" />
    </div>

    {/* ── Occasions strip ── */}
    <div className="mt-5 px-4 mb-1">
      <h2 className="font-black text-sm text-gray-800 mb-3">🎉 Popular Occasions</h2>
    </div>
    <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar">
      {OCCASIONS.map((o, i) => (
        <button key={i} onClick={() => navigate(SCREENS.UPLOAD)}
          className="shrink-0 flex flex-col items-center gap-1.5 bg-white rounded-2xl px-4 py-3 border border-pink-100 shadow-sm hover:border-pink-300 transition-all hover:scale-[1.04]">
          <span className="text-2xl">{o.icon}</span>
          <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap">{o.label}</span>
        </button>
      ))}
    </div>

    {/* ── Stats row ── */}
    <div className="grid grid-cols-3 gap-3 px-4 mt-4">
      {[
        { label: 'Credits', value: user?.credits || 0, emoji: '⚡', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100', screen: SCREENS.CREDITS },
        { label: 'Designs', value: designs.length, emoji: '🖼️', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100', screen: null },
        { label: 'Orders', value: orders.length, emoji: '📦', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', screen: SCREENS.ORDERS },
      ].map((s, i) => (
        <button key={i} onClick={() => s.screen && navigate(s.screen)} className="text-left">
          <Card className={`border ${s.border} shadow-sm hover:scale-[1.02] transition-transform`}>
            <CardContent className="p-3 text-center">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-1.5 text-lg`}>{s.emoji}</div>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>

    {/* ── Recent Designs ── */}
    {designs.length > 0 && (
      <div className="mt-6">
        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="font-black text-sm text-gray-800">Recent Designs</h2>
          <button onClick={() => navigate(SCREENS.ORDERS)} className="text-xs text-pink-500 font-bold">See all →</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 no-scrollbar">
          {designs.slice(0, 5).map(d => (
            <Card key={d.id} className="border border-pink-100 shadow-sm shrink-0 w-44 cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden"
              onClick={() => { setSelectedDesign(d); navigate(SCREENS.DESIGN) }}>
              <CardContent className="p-0">
                {d.decorated_image ? (
                  <img
                    src={d.decorated_image.includes('ik.imagekit.io') ? `${d.decorated_image}?tr=w-352,h-224,q-75,c-maintain_ratio` : d.decorated_image}
                    alt="Design" className="w-full h-28 object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-28 bg-pink-50 flex items-center justify-center text-3xl">🎀</div>
                )}
                <div className="p-2.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${d.status === 'ordered' ? 'bg-green-100 text-green-700' : 'bg-pink-100 text-pink-600'}`}>
                      {d.status === 'ordered' ? 'ORDERED' : 'READY'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-700">{d.occasion?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                  <p className="text-[10px] text-gray-400">{d.room_type}</p>
                  <div className="flex items-center mt-1">
                    <IndianRupee className="w-3 h-3 text-pink-500" />
                    <span className="text-xs font-black text-pink-500">{d.total_cost?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* New design card */}
          <button onClick={() => navigate(SCREENS.UPLOAD)}
            className="shrink-0 w-36 h-[164px] border-2 border-dashed border-pink-200 rounded-xl bg-white flex flex-col items-center justify-center gap-2 hover:border-pink-400 transition-all hover:scale-[1.02]">
            <span className="text-3xl">✨</span>
            <span className="text-xs font-bold text-pink-400">New Design</span>
          </button>
        </div>
      </div>
    )}

    {/* ── Empty state ── */}
    {designs.length === 0 && (
      <div className="mx-4 mt-6 p-6 bg-white rounded-2xl border border-pink-100 shadow-sm text-center">
        <div className="text-4xl mb-3">🎨</div>
        <h3 className="font-black text-gray-800 text-base mb-1">No designs yet</h3>
        <p className="text-gray-400 text-xs mb-4 leading-relaxed">Upload a room photo and let AI create a stunning decoration plan for you</p>
        <button onClick={() => navigate(SCREENS.UPLOAD)}
          className="gradient-pink text-white font-bold text-sm px-6 py-3 rounded-xl shadow-pink hover:opacity-90 transition-opacity">
          ✨ Create Your First Design
        </button>
      </div>
    )}

    {/* ── How It Works ── */}
    <div className="px-4 mt-6">
      <h2 className="font-black text-sm text-gray-800 mb-4">How It Works</h2>
      <div className="space-y-3">
        {[
          { step: '01', title: 'Capture Your Space', desc: 'Take a photo of the room you want decorated', emoji: '📷' },
          { step: '02', title: 'AI Decorates It', desc: 'AI adds beautiful decorations to YOUR actual photo', emoji: '✨' },
          { step: '03', title: 'Decorator Arrives', desc: 'Our verified decorator sets everything up at your home', emoji: '🚚' },
        ].map(s => (
          <div key={s.step} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-pink-50 shadow-sm">
            <div className="w-12 h-12 gradient-pink rounded-2xl flex items-center justify-center shrink-0 shadow-pink text-xl">
              {s.emoji}
            </div>
            <div className="flex-1">
              <div className="text-[9px] font-black text-pink-400 tracking-wider mb-0.5">STEP {s.step}</div>
              <p className="text-sm font-bold text-gray-800">{s.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ── Trust badges ── */}
    <div className="flex gap-2 px-4 mt-5">
      {[
        { icon: '🔒', label: 'Secure Payment' },
        { icon: '⭐', label: 'Top Decorators' },
        { icon: '✅', label: 'Verified Service' },
      ].map((t, i) => (
        <div key={i} className="flex-1 flex items-center justify-center gap-1.5 bg-white rounded-xl py-2.5 border border-gray-100 shadow-sm">
          <span className="text-sm">{t.icon}</span>
          <span className="text-[10px] font-bold text-gray-600">{t.label}</span>
        </div>
      ))}
    </div>

  </div>
  )
}
