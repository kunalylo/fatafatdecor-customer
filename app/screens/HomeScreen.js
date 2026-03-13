'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Settings, Zap, Camera, ArrowRight, Image, Package, IndianRupee, Sparkles, Truck, MapPin, ChevronDown, Loader2, X, Home, Navigation } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function HomeScreen() {
  const {
    user, designs, orders, navigate, setSelectedDesign,
    userAddress, locationLoading, locationDenied, detectLocation,
    showAddressModal, setShowAddressModal, updateAddressDetails
  } = useApp()

  const [flatInput, setFlatInput] = useState(userAddress?.flat || '')
  const [landmarkInput, setLandmarkInput] = useState(userAddress?.landmark || '')

  // Sync inputs when modal opens
  const openModal = () => {
    setFlatInput(userAddress?.flat || '')
    setLandmarkInput(userAddress?.landmark || '')
    setShowAddressModal(true)
  }

  const handleSaveAddress = () => {
    if (!flatInput.trim()) { return } // Flat is required
    updateAddressDetails(flatInput, landmarkInput)
  }

  // Location bar label
  const locationLabel = () => {
    if (userAddress?.flat && userAddress?.area) return `${userAddress.flat}, ${userAddress.area}`
    if (userAddress?.flat && userAddress?.city) return `${userAddress.flat}, ${userAddress.city}`
    if (userAddress?.area || userAddress?.city) return userAddress.area || userAddress.city
    return null
  }

  return (
  <div className="slide-up pb-24 bg-white min-h-screen">
    <div className="gradient-pink p-6 pb-10 rounded-b-3xl">

      {/* Location bar — tap opens modal if location exists, else detects */}
      <button
        onClick={() => userAddress?.city ? openModal() : detectLocation(user?.id)}
        className="flex items-center gap-1.5 mb-3 max-w-full"
      >
        <MapPin className={`w-4 h-4 shrink-0 ${locationDenied ? 'text-red-300' : 'text-yellow-200'}`} />
        <div className="flex-1 min-w-0 text-left">
          {locationLoading ? (
            <span className="flex items-center gap-1.5 text-white/80 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" /> Detecting location...
            </span>
          ) : locationDenied ? (
            <span className="text-red-200 text-xs font-medium">Location blocked — tap to retry</span>
          ) : locationLabel() ? (
            <>
              <p className="text-white font-bold text-sm leading-tight truncate">
                {locationLabel()}
              </p>
              {userAddress?.city && userAddress?.flat && (
                <p className="text-white/70 text-xs truncate">{userAddress.city}{userAddress.pincode ? ` - ${userAddress.pincode}` : ''}</p>
              )}
              {!userAddress?.flat && userAddress?.city && (
                <p className="text-white/70 text-xs truncate">Tap to add flat / building</p>
              )}
            </>
          ) : (
            <span className="text-white/70 text-xs">Tap to detect location</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-white/70 shrink-0" />
      </button>

      {/* Header row */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-white/70 text-xs">Welcome back</p>
          <h1 className="text-white text-xl font-bold">{user?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-full px-3 py-1.5 flex items-center gap-1">
            <Zap className="w-4 h-4 text-yellow-200" />
            <span className="text-white font-bold text-sm">{user?.credits || 0}</span>
          </div>
          {user?.role === 'admin' && (
            <button onClick={() => navigate(SCREENS.ADMIN)} className="bg-white/20 rounded-full p-2">
              <Settings className="w-4 h-4 text-white" />
            </button>
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
                  <img src={`data:image/png;base64,${d.decorated_image}`} alt="Design" className="w-full h-28 object-cover rounded-t-xl" />
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
          { step: 3, title: 'Fatafat Delivery', desc: 'We deliver all items to your doorstep', icon: Truck }
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

    {/* ===== Address Bottom Sheet Modal ===== */}
    {showAddressModal && (
      <div className="fixed inset-0 z-50 flex items-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddressModal(false)} />

        {/* Sheet */}
        <div className="relative w-full bg-white rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl animate-slide-up">
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-gray-800">Your Delivery Address</h2>
            <button onClick={() => setShowAddressModal(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Auto-detected address preview */}
          {userAddress?.formatted && (
            <div className="flex items-start gap-2 bg-pink-50 rounded-xl p-3 mb-4">
              <Navigation className="w-4 h-4 text-pink-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-pink-400 font-medium uppercase tracking-wide mb-0.5">GPS Detected</p>
                <p className="text-xs text-gray-600 leading-relaxed">{userAddress.formatted}</p>
              </div>
            </div>
          )}

          {/* Flat / Building */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Flat / House No. / Building <span className="text-pink-500">*</span>
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-pink-400 transition-colors">
              <Home className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={flatInput}
                onChange={e => setFlatInput(e.target.value)}
                placeholder="e.g. Flat 204, Sunrise Apartments"
                className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder-gray-300"
                autoFocus
              />
            </div>
          </div>

          {/* Landmark */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Landmark <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-pink-400 transition-colors">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={landmarkInput}
                onChange={e => setLandmarkInput(e.target.value)}
                placeholder="e.g. Near City Mall, Opp. HDFC Bank"
                className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder-gray-300"
              />
            </div>
          </div>

          {/* Full address preview */}
          {flatInput.trim() && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-500 leading-relaxed">
              <p className="font-semibold text-gray-700 mb-0.5 text-[11px] uppercase tracking-wide">Decorator will navigate to:</p>
              <p>{[flatInput.trim(), userAddress?.area, userAddress?.city, userAddress?.state, userAddress?.pincode].filter(Boolean).join(', ')}</p>
              {landmarkInput.trim() && <p className="mt-0.5 text-pink-500">📍 Near: {landmarkInput.trim()}</p>}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSaveAddress}
            disabled={!flatInput.trim()}
            className="w-full gradient-pink text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-pink transition-opacity"
          >
            Save Address
          </button>

          {/* Skip */}
          <button
            onClick={() => setShowAddressModal(false)}
            className="w-full text-gray-400 text-xs mt-3 py-1"
          >
            Skip for now
          </button>
        </div>
      </div>
    )}
  </div>
)
}
