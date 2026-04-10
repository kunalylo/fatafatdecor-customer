'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, MapPin, Clock, Phone, Navigation, Package, IndianRupee, Gift } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, SUPPORT_PHONE } from '../lib/constants'

export default function OrderDetailScreen() {
  const { selectedOrder, navigate } = useApp()
  if (!selectedOrder) return null
  const o = selectedOrder

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-600',
    assigned: 'bg-blue-100 text-blue-600',
    en_route: 'bg-blue-100 text-blue-600',
    arrived: 'bg-purple-100 text-purple-600',
    decorating: 'bg-orange-100 text-orange-600',
    delivered: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
  }

  const paymentColor = {
    pending: 'bg-red-100 text-red-600',
    partial: 'bg-yellow-100 text-yellow-600',
    full: 'bg-green-100 text-green-600',
  }

  const canTrack = ['assigned', 'en_route', 'arrived', 'decorating'].includes(o.delivery_status)

  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(SCREENS.ORDERS)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-bold text-lg text-gray-800">Order Details</h1>
        <Badge className={`ml-auto capitalize ${statusColor[o.delivery_status] || 'bg-gray-100 text-gray-500'}`}>
          {o.delivery_status?.replace('_', ' ')}
        </Badge>
      </div>

      <div className="px-4 space-y-4">
        {/* Order Summary */}
        <Card className="border border-gray-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Order ID</span>
              <span className="text-sm font-mono text-gray-700">#{o.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Date</span>
              <span className="text-sm text-gray-700">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="text-sm font-bold text-pink-500 flex items-center"><IndianRupee className="w-3 h-3" />{o.total_cost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Payment</span>
              <div className="flex items-center gap-2">
                {o.payment_amount > 0 && <span className="text-xs text-gray-500">Rs {o.payment_amount} paid</span>}
                <Badge className={paymentColor[o.payment_status] || 'bg-gray-100 text-gray-500'}>{o.payment_status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Slot */}
        {(o.delivery_slot?.date || o.requested_slot?.date) && (
          <Card className="border border-blue-100 bg-blue-50/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">Delivery Slot</p>
                <p className="text-xs text-gray-500">
                  {(o.delivery_slot?.date || o.requested_slot?.date)} at {(o.delivery_slot?.hour ?? o.requested_slot?.hour)}:00
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Address */}
        {o.delivery_address && (
          <Card className="border border-gray-100">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">Delivery Address</p>
                <p className="text-xs text-gray-500 mt-0.5">{o.delivery_address}</p>
                {o.delivery_landmark && <p className="text-xs text-gray-400 mt-0.5">Landmark: {o.delivery_landmark}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gift Items */}
        {o.has_gifts && o.gift_items?.length > 0 && (
          <Card className="border border-pink-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-pink-500" />
                <h3 className="font-bold text-sm text-gray-700">Gift Add-ons</h3>
              </div>
              {o.gift_items.map((g, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{g.quantity || 1}x {g.name}</span>
                  <span className="text-sm font-semibold text-pink-500">Rs {((g.price || 0) * (g.quantity || 1)).toFixed(0)}</span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-pink-100">
                <span className="text-xs font-bold text-gray-600">Gifts Total</span>
                <span className="text-sm font-bold text-pink-500">Rs {o.gift_total || 0}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Decoration Items */}
        <Card className="border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-purple-500" />
              <h3 className="font-bold text-sm text-gray-700">Decoration Items</h3>
            </div>
            {(o.items || []).length > 0 ? (o.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <span className="text-xs text-gray-400 ml-1">x{item.quantity || 1}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">Rs {((item.price || item.selling_price_unit || 0) * (item.quantity || 1)).toFixed(0)}</span>
              </div>
            ))) : (
              <p className="text-xs text-gray-400 py-2">Item details will be available after order confirmation</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {o.payment_status === 'pending' && (
            <Button onClick={() => navigate(SCREENS.BOOKING)}
              className="w-full h-12 gradient-pink border-0 text-white font-bold rounded-2xl shadow-pink">
              Complete Booking & Payment
            </Button>
          )}
          {canTrack && (
            <Button onClick={() => navigate(SCREENS.TRACKING)}
              className="w-full h-12 gradient-pink border-0 text-white font-bold rounded-2xl shadow-pink">
              <Navigation className="w-4 h-4 mr-2" /> Track Delivery
            </Button>
          )}
          <div className="text-center pt-2">
            <a href={`tel:${SUPPORT_PHONE}`} className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Phone className="w-3 h-3" /> Need help? Call {SUPPORT_PHONE}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
