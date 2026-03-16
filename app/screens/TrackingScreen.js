'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight, MapPin, Truck, CheckCircle2, Star, User, Phone, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function TrackingScreen() {
  const { orders, selectedOrder, setSelectedOrder, trackingData, mapRef, mapInstance, navigate } = useApp()
  const trackableOrders = orders.filter(o => o.delivery_status === 'assigned' || o.delivery_status === 'in_transit')

  useEffect(() => {
    if (!trackingData || !mapRef.current || typeof window === 'undefined') return
    const dloc = trackingData.delivery_location
    const uloc = trackingData.user_location
    if (!dloc?.lat && !uloc?.lat) return

    const initGMap = () => {
      if (mapInstance.current) {
        window.google.maps.event.clearInstanceListeners(mapInstance.current)
        mapInstance.current = null
      }
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: dloc?.lat || uloc?.lat || 28.6139, lng: dloc?.lng || uloc?.lng || 77.2090 },
        zoom: 14,
        disableDefaultUI: true,
        gestureHandling: 'cooperative',
      })
      if (dloc?.lat) {
        new window.google.maps.Marker({
          position: { lat: dloc.lat, lng: dloc.lng }, map,
          title: trackingData.delivery_person?.name || 'Decorator',
          icon: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
        })
      }
      if (uloc?.lat) {
        new window.google.maps.Marker({
          position: { lat: uloc.lat, lng: uloc.lng }, map,
          title: 'Your Location',
          icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        })
      }
      mapInstance.current = map
    }

    if (window.google?.maps) {
      initGMap()
    } else {
      const poll = setInterval(() => {
        if (window.google?.maps) { clearInterval(poll); initGMap() }
      }, 100)
      return () => clearInterval(poll)
    }
    return () => {
      if (mapInstance.current) {
        window.google?.maps?.event?.clearInstanceListeners(mapInstance.current)
        mapInstance.current = null
      }
    }
  }, [trackingData])

  // Status step order — includes 'pending' at the start
  const statusOrder = ['pending', 'assigned', 'en_route', 'arrived', 'decorating', 'delivered']

  const statusSteps = [
    { key: 'pending',    label: 'Order Confirmed — Waiting for Decorator', icon: <CheckCircle2 className="w-4 h-4 text-white" /> },
    { key: 'assigned',   label: 'Decorator Accepted Your Order',           icon: <CheckCircle2 className="w-4 h-4 text-white" /> },
    { key: 'en_route',   label: 'Decorator is On the Way',                 icon: <Truck className="w-4 h-4 text-white" /> },
    { key: 'arrived',    label: 'Decorator Arrived at Your Place',         icon: <MapPin className="w-4 h-4 text-white" /> },
    { key: 'decorating', label: 'Decorating in Progress 🎨',               icon: <Star className="w-4 h-4 text-white" /> },
    { key: 'delivered',  label: 'Decoration Complete 🎉',                  icon: <CheckCircle2 className="w-4 h-4 text-white" /> },
  ]

  // Decorator has accepted = delivery_person is set (not just auto-assigned)
  const decoratorAccepted = !!(trackingData?.delivery_person)

  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(SCREENS.ORDERS)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
          <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
        </button>
        <h1 className="font-bold text-lg text-gray-800">Live Tracking</h1>
      </div>

      <div className="px-4 space-y-4">
        {!selectedOrder && trackableOrders.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-pink-200 mx-auto mb-3" />
            <p className="text-gray-400">No active deliveries</p>
          </div>
        )}

        {!selectedOrder && trackableOrders.length > 0 && trackableOrders.map(o => (
          <Card key={o.id} className="border border-gray-100 cursor-pointer" onClick={() => setSelectedOrder(o)}>
            <CardContent className="p-3 flex items-center gap-3">
              <Truck className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Order #{o.id.slice(0, 8)}</p>
                <p className="text-xs text-gray-400 capitalize">{o.delivery_status}</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-gray-300" />
            </CardContent>
          </Card>
        ))}

        {/* Loading state before trackingData arrives */}
        {selectedOrder && !trackingData && (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full gradient-pink flex items-center justify-center mx-auto mb-4 animate-pulse shadow-pink">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <p className="font-bold text-gray-700 text-lg">Order Confirmed!</p>
            <p className="text-sm text-gray-400 mt-1">Payment received. Finding your decorator...</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {selectedOrder && trackingData && (
          <>
            {/* Map — only show once decorator is en_route or further */}
            {['en_route','arrived','decorating','delivered'].includes(trackingData.delivery_status) && (
              <div ref={mapRef} style={{ width: '100%', height: '250px', borderRadius: '16px' }} className="bg-pink-50 border border-pink-100" />
            )}

            {/* Order confirmed banner shown when still pending/waiting */}
            {trackingData.delivery_status === 'pending' && (
              <Card className="border-2 border-yellow-200 bg-yellow-50/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-yellow-700">Order Confirmed ✅ Payment Done ✅</p>
                    <p className="text-xs text-yellow-600 mt-0.5">Waiting for a decorator to accept your order...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Steps */}
            <Card className="border border-gray-100">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm text-gray-700 mb-3">Status</h3>
                <div className="space-y-3">
                  {statusSteps.map(({ key, label, icon }, i) => {
                    const isActive = statusOrder.indexOf(trackingData.delivery_status) >= i
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'gradient-pink' : 'bg-gray-100'}`}>
                          {icon}
                        </div>
                        <p className={`text-sm font-semibold ${isActive ? 'text-gray-700' : 'text-gray-300'}`}>{label}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Decorator card — show name ONLY after decorator accepts */}
            {decoratorAccepted ? (
              <Card className="border border-gray-100">
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3">Your Decorator</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-pink flex items-center justify-center shadow-pink">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-700">{trackingData.delivery_person.name}</p>
                      <p className="text-xs text-gray-400">Your Decorator</p>
                    </div>
                    <a href={`tel:${trackingData.delivery_person.phone}`}
                      className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                      <Phone className="w-5 h-5 text-white" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Decorator not yet accepted — show contact support */
              <Card className="border border-orange-100 bg-orange-50/30">
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3">Decorator Status</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-700">Decorator Not Assigned Yet</p>
                      <p className="text-xs text-gray-400">Need help? Contact our support</p>
                    </div>
                    <a href="tel:7009110035"
                      className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                      <Phone className="w-5 h-5 text-white" />
                    </a>
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-3 font-medium">📞 Support: 7009110035</p>
                </CardContent>
              </Card>
            )}

            {/* OTP block — shown when decorator arrives */}
            {trackingData.verification_otp && !trackingData.otp_verified && (
              <Card className="border-2 border-pink-300 bg-pink-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full gradient-pink flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🔐</span>
                    </div>
                    <h3 className="font-bold text-sm text-pink-700">Your Verification OTP</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Your decorator has arrived! Share this code with them to start the decoration.</p>
                  <div className="flex items-center justify-center gap-2 bg-white rounded-2xl py-4 border-2 border-pink-200">
                    {trackingData.verification_otp.split('').map((digit, i) => (
                      <div key={i} className="w-14 h-16 rounded-xl gradient-pink flex items-center justify-center shadow-pink">
                        <span className="text-white text-3xl font-black">{digit}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-center text-pink-400 mt-2 font-medium">Show this to your decorator — do not share with anyone else</p>
                </CardContent>
              </Card>
            )}

            {/* Decoration in progress confirmation */}
            {trackingData.otp_verified && (
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-bold text-sm text-green-700">Decoration in Progress!</p>
                    <p className="text-xs text-green-500">OTP verified — your decorator is at work 🎉</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
