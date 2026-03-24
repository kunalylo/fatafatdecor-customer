'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Settings, Zap, Camera, ArrowRight, Image, Package, IndianRupee, Sparkles, Truck, MapPin, ChevronDown, Loader2, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function HomeScreen() {
  const {
    user, designs, orders, navigate, setSelectedDesign,
    userAddress, locationLoading, locationDenied, detectLocation,
  } = useApp()

  // What the location bar shows
  const locationTop = () => {
    if (userAddress?.flat && userAddress?.area) return `${userAddress.flat}, ${userAddress.area}`
    if (userAddress?.flat && userAddress?.city) return `${userAddress.flat}, ${userAddress.city}`
    if (userAddress?.area) return userAddress.area
    if (userAddress?.city) return userAddress.city
    return null
  }

  const locationSub = () => {
    if (userAddress?.flat) {
      return [userAddress.city, userAddress.pincode].filter(Boolean).join(' - ')
    }
    if (userAddress?.city) return 'Tap to add flat / building'
    return null
  }

  return (
  <div className="slide-up pb-24 bg-white min-h-screen">
    <div className="gradient-pink p-6 pb-10 rounded-b-3xl">

      {/* Location bar — two-action: refresh GPS | edit exact address */}
      <div className="flex items-center gap-1.5 mb-3 max-w-full">
        {/* Left: GPS refresh */}
        <button
          onClick={() => detectLocation(user?.id)}
          className="shrink-0 p-1"
        >
          {locationLoading
            ? <Loader2 className="w-4 h-4 text-yellow-200 animate-spin" />
            : <MapPin className={`w-4 h-4 ${locationDenied ? 'text-red-300' : 'text-yellow-200'}`} />
          }
        </button>

        {/* Centre: address display → tap to set exact location */}
        <button
          onClick={() => navigate(SCREENS.ADDRESS)}
          className="flex-1 min-w-0 text-left"
        >
          {locationDenied ? (
            <span className="text-red-200 text-xs font-medium">Location blocked — tap GPS to retry</span>
          ) : locationTop() ? (
            <>
              <p className="text-white font-bold text-sm leading-tight truncate">{locationTop()}</p>
              {locationSub() && (
                <p className="text-white/70 text-xs truncate">{locationSub()}</p>
              )}
            </>
          ) : locationLoading ? (
            <span className="text-white/70 text-xs">Detecting location…</span>
          ) : (
            <span className="text-white/70 text-xs">Tap to set your location</span>
          )}
        </button>

        {/* Right: chevron → also opens address */}
        <button onClick={() => navigate(SCREENS.ADDRESS)} className="shrink-0">
          <ChevronDown className="w-4 h-4 text-white/70" />
        </button>
      </div>

      {/* Header row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img src="/logo.png" alt="FatafatDecor" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white/70 text-xs">Welcome back</p>
            <h1 className="text-white text-xl font-bold">{user?.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-full px-3 py-1.5 flex items-center gap-1">
            <Zap className="w-4 h-4 text-yellow-200" />
            <span className="text-white font-bold text-sm">{user?.credits || 0}</span>
          </div>
          {user?.role === 'admin' && (
            <a href="/admin" className="bg-white/20 rounded-full p-2 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </a>
          )}
        </div>
      </div>
    </div>

    <div className="px-4 -mt-6">
      <Card className="border-0 shadow-lg shadow-pink-100/50 cursor-pointer hover:scale-[1.02] transition-transform bg-white" onClick={() => navigate(SCREENS.UPLOAD)}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-14 h-14 gradient-pink rounded-2xl flex items-center justify-center shrink-0 shadow-pink">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800">Decorate Your Space</h3>
            <p className="text-gray-400 text-xs mt-0.5">Take a photo & let AI create magic</p>
          </div>
          <ArrowRight className="w-5 h-5 text-pink-400" />
        </CardContent>
      </Card>
    </div>

    <div className="grid grid-cols-3 gap-3 px-4 mt-4">
      {[
        { label: 'Credits', value: user?.credits || 0, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { label: 'Designs', value: designs.length, icon: Image, color: 'text-pink-500', bg: 'bg-pink-50' },
        { label: 'Orders', value: orders.length, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' }
      ].map((s, i) => (
        <Card key={i} className="border border-gray-100 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-1`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-lg font-bold text-gray-800">{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    {designs.length > 0 && (
      <div className="px-4 mt-6">
        <h2 className="font-bold text-base text-gray-800 mb-3">Recent Designs</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {designs.slice(0, 5).map(d => (
            <Card key={d.id} className="border border-gray-100 shadow-sm shrink-0 w-44 cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => { setSelectedDesign(d); navigate(SCREENS.DESIGN) }}>
              <CardContent className="p-0">
                {d.decorated_image ? (
                  <img src={d.decorated_image} alt="Design" className="w-full h-28 object-cover rounded-t-xl" />
                ) : (
                  <div className="w-full h-28 bg-pink-50 rounded-t-xl flex items-center justify-center"><Image className="w-8 h-8 text-pink-300" /></div>
                )}
                <div className="p-2">
                  <p className="text-xs font-semibold capitalize text-gray-700">{d.occasion}</p>
                  <p className="text-[10px] text-gray-400">{d.room_type}</p>
                  <div className="flex items-center mt-1">
                    <IndianRupee className="w-3 h-3 text-pink-500" />
                    <span className="text-xs font-bold text-pink-500">{d.total_cost}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )}

    <div className="px-4 mt-6">
      <h2 className="font-bold text-base text-gray-800 mb-3">How It Works</h2>
      <div className="space-y-3">
        {[
          { step: 1, title: 'Capture Your Space', desc: 'Take a photo of the room to decorate', icon: Camera },
          { step: 2, title: 'AI Decorates It', desc: 'AI adds decorations to YOUR actual space', icon: Sparkles },
          { step: 3, title: 'Decorator Arrives', desc: 'Our decorator comes to your home and sets everything up!', icon: Truck }
        ].map(s => (
          <div key={s.step} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center shrink-0 shadow-pink">
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{s.title}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
}
