'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Package, IndianRupee, Gift, Wand2, Sparkles, Inbox } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, api } from '../lib/constants'

const ik = (url, tr) => (url && url.includes('ik.imagekit.io') ? `${url}?tr=${tr}` : url)

// Lead-status display map (matches backend SEED_LEAD_STATUSES)
const LEAD_STATUS = {
  'callback-pending': { label: 'Callback pending', cls: 'bg-amber-100 text-amber-700' },
  'quote-shared':     { label: 'Quote shared',     cls: 'bg-pink-100 text-pink-700' },
  'confirmed':        { label: 'Confirmed',        cls: 'bg-green-100 text-green-700' },
}

export default function OrdersScreen() {
  const { orders, setSelectedOrder, navigate, giftOrders, designs, setSelectedDesign, user } = useApp()
  const [tab, setTab] = useState('decoration')
  const [leads, setLeads] = useState([])

  useEffect(() => {
    if (!user) return
    api('leads/mine').then(d => { if (Array.isArray(d)) setLeads(d) })
  }, [user?.id])

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
        <button
          onClick={() => setTab('designs')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'designs' ? 'btn-primary-luxury text-white' : 'text-gray-500'}`}>
          Designs {designs.length > 0 && <span className="ml-1 bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{designs.length}</span>}
        </button>
        {leads.length > 0 && (
          <button
            onClick={() => setTab('enquiries')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'enquiries' ? 'btn-primary-luxury text-white' : 'text-gray-500'}`}>
            Enquiries
          </button>
        )}
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

      {tab === 'enquiries' && (
        <>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">No enquiries yet</p>
            </div>
          ) : leads.map(l => {
            const st = LEAD_STATUS[l.status] || LEAD_STATUS['callback-pending']
            return (
              <div key={l.id} className="glass-floating rounded-[22px] p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl accent-lavender flex items-center justify-center flex-shrink-0">
                    <Inbox className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{l.leadId}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/70 border border-gray-100 text-gray-500">{l.type}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {[l.occasion, l.quantity ? `${l.quantity} units` : '', l.budget].filter(Boolean).join(' · ') || 'Enquiry'}
                    </p>
                  </div>
                  <Badge className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
                </div>
                {l.created_at && (
                  <p className="text-[10px] text-gray-400 mt-2">{new Date(l.created_at).toLocaleDateString()}</p>
                )}
              </div>
            )
          })}
        </>
      )}

      {tab === 'designs' && (
        <>
          {designs.length === 0 ? (
            <div className="text-center py-12">
              <Wand2 className="w-12 h-12 text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">No designs yet</p>
              <Button onClick={() => navigate(SCREENS.UPLOAD)} className="mt-3 btn-primary-luxury border-0 text-white">Create Design</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {designs.map(d => (
                <button key={d.id} onClick={() => { setSelectedDesign(d); navigate(SCREENS.DESIGN) }}
                  className="glass-floating rounded-[22px] overflow-hidden text-left hover:-translate-y-0.5 transition-transform">
                  <div className="aspect-square relative bg-pink-50/50">
                    {d.decorated_image
                      ? <img src={ik(d.decorated_image, 'w-400,h-400,q-75,c-maintain_ratio')} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Sparkles className="w-8 h-8 text-pink-300" /></div>}
                    <span className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full ${d.status === 'ordered' ? 'bg-green-100 text-green-700' : 'bg-white/90 text-pink-600'}`}>{d.status === 'ordered' ? 'ORDERED' : 'READY'}</span>
                  </div>
                  <div className="p-3">
                    <p className="text-pink-600 text-[10px] font-bold uppercase capitalize mb-0.5">{d.occasion?.replace(/_/g, ' ')}</p>
                    <h4 className="text-gray-900 font-bold text-[13px] capitalize mb-1">{d.room_type}</h4>
                    <p className="text-gray-900 text-sm font-bold flex items-center"><IndianRupee className="w-3 h-3" />{d.total_cost?.toLocaleString('en-IN')}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  </div>
)
}
