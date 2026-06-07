'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Package, IndianRupee, Gift } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function OrdersScreen() {
  const { orders, setSelectedOrder, navigate, giftOrders } = useApp()
  const [tab, setTab] = useState('decoration')

  return (
  <div className="slide-up pb-28 bg-aurora min-h-screen">
    <div className="p-4 pt-12">
      <p className="eyebrow text-gray-400">Your history</p>
      <h1 className="font-display text-3xl text-gray-900 leading-tight">My <span className="italic iridescent-text">orders</span></h1>
    </div>

    {/* Tab toggle */}
    <div className="px-4 mb-4">
      <div className="flex glass-card rounded-2xl p-1">
        <button
          onClick={() => setTab('decoration')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'decoration' ? 'btn-primary-luxury text-white' : 'text-gray-500'}`}>
          Decoration
        </button>
        <button
          onClick={() => setTab('gifts')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'gifts' ? 'btn-primary-luxury text-white' : 'text-gray-500'}`}>
          Gifts {giftOrders.filter(o => o.payment_status !== 'pending').length > 0 && <span className="ml-1 bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{giftOrders.filter(o => o.payment_status !== 'pending').length}</span>}
        </button>
      </div>
    </div>

    <div className="px-4 space-y-3">
      {tab === 'decoration' && (
        <>
          {orders.filter(o => o.payment_status !== 'pending').length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">No orders yet</p>
              <Button onClick={() => navigate(SCREENS.UPLOAD)} className="mt-3 btn-primary-luxury border-0 text-white">Create Design</Button>
            </div>
          ) : orders.filter(o => o.payment_status !== 'pending').map(o => (
            <div key={o.id} className="glass-floating rounded-[22px] cursor-pointer hover:scale-[1.01] transition-transform p-4"
              onClick={() => {
                setSelectedOrder(o)
                if (['assigned', 'en_route', 'arrived', 'decorating'].includes(o.delivery_status)) navigate(SCREENS.TRACKING)
                else navigate(SCREENS.ORDER_DETAIL)
              }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl accent-pink flex items-center justify-center"><Package className="w-5 h-5 text-white" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Order #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-pink-500 flex items-center justify-end"><IndianRupee className="w-3 h-3" />{o.total_cost}</p>
                  <Badge className={`text-[10px] ${o.delivery_status === 'delivered' ? 'bg-green-100 text-green-600' : o.delivery_status === 'en_route' ? 'bg-blue-100 text-blue-600' : o.delivery_status === 'assigned' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>{o.delivery_status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'gifts' && (
        <>
          {giftOrders.filter(o => o.payment_status !== 'pending').length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">No gift orders yet</p>
              <Button onClick={() => navigate(SCREENS.GIFTS)} className="mt-3 btn-primary-luxury border-0 text-white">Send Gifts</Button>
            </div>
          ) : giftOrders.filter(o => o.payment_status !== 'pending').map(o => (
            <div key={o.id} className="glass-floating rounded-[22px] cursor-pointer hover:scale-[1.01] transition-transform p-4"
              onClick={() => {
                setSelectedOrder(o)
                navigate(SCREENS.ORDER_DETAIL)
              }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl accent-pink flex items-center justify-center"><Gift className="w-5 h-5 text-white" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {o.gift_items?.[0]?.name || 'Gift Order'}
                    {o.gift_items?.length > 1 ? ` +${o.gift_items.length - 1} more` : ''}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-pink-500 flex items-center justify-end"><IndianRupee className="w-3 h-3" />{o.gift_total}</p>
                  <Badge className={`text-[10px] ${o.delivery_status === 'delivered' ? 'bg-green-100 text-green-600' : o.payment_status === 'full' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {(o.delivery_status || (o.payment_status === 'full' ? 'paid' : 'pending'))?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  </div>
)
}
