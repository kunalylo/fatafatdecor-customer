'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Package, IndianRupee, Gift } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function OrdersScreen() {
  const { orders, setSelectedOrder, navigate, giftOrders } = useApp()
  const [tab, setTab] = useState('decoration')

  return (
  <div className="slide-up pb-24 bg-white min-h-screen">
    <div className="p-4"><h1 className="font-bold text-lg text-gray-800">My Orders</h1></div>

    {/* Tab toggle */}
    <div className="px-4 mb-4">
      <div className="flex bg-gray-100 rounded-2xl p-1">
        <button
          onClick={() => setTab('decoration')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'decoration' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>
          Decoration
        </button>
        <button
          onClick={() => setTab('gifts')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'gifts' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>
          Gifts {giftOrders.length > 0 && <span className="ml-1 bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{giftOrders.length}</span>}
        </button>
      </div>
    </div>

    <div className="px-4 space-y-3">
      {tab === 'decoration' && (
        <>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">No orders yet</p>
              <Button onClick={() => navigate(SCREENS.UPLOAD)} className="mt-3 gradient-pink border-0 text-white shadow-pink">Create Design</Button>
            </div>
          ) : orders.map(o => (
            <Card key={o.id} className="border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedOrder(o)
                if (['assigned', 'en_route', 'arrived', 'decorating'].includes(o.delivery_status)) navigate(SCREENS.TRACKING)
                else if (o.payment_status === 'pending') navigate(SCREENS.BOOKING)
                else navigate(SCREENS.ORDER_DETAIL)
              }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center"><Package className="w-5 h-5 text-pink-500" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-pink-500 flex items-center justify-end"><IndianRupee className="w-3 h-3" />{o.total_cost}</p>
                    <Badge className={`text-[10px] ${o.delivery_status === 'delivered' ? 'bg-green-100 text-green-600' : o.delivery_status === 'en_route' ? 'bg-blue-100 text-blue-600' : o.delivery_status === 'assigned' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>{o.delivery_status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {tab === 'gifts' && (
        <>
          {giftOrders.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">No gift orders yet</p>
              <Button onClick={() => navigate(SCREENS.GIFTS)} className="mt-3 gradient-pink border-0 text-white shadow-pink">Send Gifts</Button>
            </div>
          ) : giftOrders.map(o => (
            <Card key={o.id} className="border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center text-xl">🎁</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {o.gift_items?.[0]?.name || 'Gift Order'}
                      {o.gift_items?.length > 1 ? ` +${o.gift_items.length - 1} more` : ''}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-pink-500 flex items-center justify-end"><IndianRupee className="w-3 h-3" />{o.gift_total}</p>
                    <Badge className={`text-[10px] ${o.delivery_status === 'delivered' ? 'bg-green-100 text-green-600' : o.payment_status === 'full' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {o.delivery_status || (o.payment_status === 'full' ? 'paid' : 'pending')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  </div>
)
}
