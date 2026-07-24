'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, CalendarClock, ShoppingBag, Gift } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, api } from '../lib/constants'

export default function FestivalScreen() {
  const {
    festivals, setFestivals, selectedFestivalId, setSelectedFestivalId,
    giftCart, setGiftCart, navigate, goBack, showToast,
  } = useApp()
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (festivals.length === 0) {
      setFetching(true)
      api('festivals')
        .then(d => { if (!d?.error && Array.isArray(d)) setFestivals(d) })
        .finally(() => setFetching(false))
    }
  }, [])

  const festival = useMemo(() => {
    if (!festivals.length) return null
    return festivals.find(f => f.id === selectedFestivalId) || festivals[0]
  }, [festivals, selectedFestivalId])

  const others = useMemo(() => {
    if (!festival) return []
    return festivals.filter(f => f.id !== festival.id).slice(0, 5)
  }, [festivals, festival])

  const hampers = festival?.hampers || []

  const addHamper = (h) => {
    const id = 'fest-' + h.id
    setGiftCart(prev => {
      const existing = prev.find(g => g.gift_id === id)
      if (existing) return prev.map(g => g.gift_id === id ? { ...g, quantity: g.quantity + 1 } : g)
      return [...prev, { gift_id: id, name: h.name, price: h.price, quantity: 1, image_url: h.image }]
    })
    showToast(`${h.name} added to bag`, 'success')
  }

  const cartCount = useMemo(() => giftCart.reduce((s, g) => s + g.quantity, 0), [giftCart])
  const cartTotal = useMemo(() => giftCart.reduce((s, g) => s + g.price * g.quantity, 0), [giftCart])

  const daysLabel = (d) => (d > 30 ? `${Math.round(d / 30)} mo` : `${d} days`)

  // ── Loading / empty states ──
  if (!festival) {
    return (
      <div className="min-h-screen bg-aurora pb-28 fade-in">
        <div className="flex items-center gap-3 p-4 pt-12">
          <button onClick={goBack} className="w-9 h-9 rounded-full glass-card flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-display text-2xl text-gray-900">Festival</h1>
        </div>
        {fetching ? (
          <div className="px-4 space-y-4 animate-pulse">
            <div className="h-64 bg-pink-50/60 rounded-[28px]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-48 bg-pink-50/60 rounded-[22px]" />
              <div className="h-48 bg-pink-50/60 rounded-[22px]" />
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <Gift className="w-12 h-12 text-pink-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No festival collections live right now — check back soon.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-aurora fade-in" style={{ paddingBottom: cartCount > 0 ? '180px' : '112px' }}>

      {/* ── Hero 420px ── */}
      <div className="relative h-[420px]">
        {festival.hero && (
          <img src={festival.hero} alt={festival.name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, rgba(255,255,255,0.95) 100%)' }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-12 z-10">
          <button onClick={goBack} className="w-10 h-10 rounded-full glass-overlay flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-800" strokeWidth={2.2} />
          </button>
        </div>

        {/* Bottom copy */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-1 z-10">
          <p className="eyebrow text-pink-600">{festival.eyebrow}</p>
          <h1 className="font-display text-[44px] font-medium text-gray-900 leading-[1.02] mt-1">{festival.name}</h1>
          <p className="text-sm text-gray-700 leading-relaxed mt-2">{festival.description}</p>
        </div>
      </div>

      {/* ── Hampers grid ── */}
      <div className="px-4 mt-6">
        <div className="px-2 mb-4">
          <p className="eyebrow text-gray-600">{hampers.length} curated picks</p>
          <h3 className="font-display text-2xl font-medium text-gray-900 mt-1">Shop the <span className="italic font-normal iridescent-text">collection</span></h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {hampers.map(h => (
            <div key={h.id} className="glass-floating rounded-[22px] overflow-hidden flex flex-col">
              <div className="relative aspect-square bg-pink-50/50">
                <img src={h.image} alt={h.name} className="w-full h-full object-cover" loading="lazy"
                  onError={e => { e.target.onerror = null; if (festival.hero) e.target.src = festival.hero }} />
                <div className={`absolute top-2.5 left-2.5 w-7 h-7 rounded-full ${festival.accent || 'accent-pink'} border-2 border-white`} />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-pink-600 text-[9px] font-bold tracking-wide uppercase mb-0.5">{h.category}</p>
                <h4 className="text-gray-900 font-bold text-[13px] leading-tight line-clamp-2 min-h-[32px]">{h.name}</h4>
                <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                  <p className="text-gray-900 text-sm font-bold">₹ {h.price?.toLocaleString('en-IN')}</p>
                  <button onClick={() => addHamper(h)}
                    className="px-3.5 py-1.5 rounded-full bg-gray-900 text-white text-[11px] font-bold active:scale-90 transition-transform">
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
          {hampers.length === 0 && (
            <div className="col-span-2 text-center py-10 text-gray-400 text-sm">Hampers for this collection are coming soon.</div>
          )}
        </div>
      </div>

      {/* ── Also coming up ── */}
      {others.length > 0 && (
        <section className="mt-8">
          <div className="px-6 mb-3">
            <p className="eyebrow text-gray-600">Also coming up</p>
            <h3 className="font-display text-2xl font-medium text-gray-900 mt-1">More to <span className="italic font-normal iridescent-text">celebrate</span></h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 px-6">
            {others.map(f => (
              <button key={f.id} onClick={() => setSelectedFestivalId(f.id)}
                className="shrink-0 w-32 text-left">
                <div className="relative w-32 h-32 rounded-[20px] overflow-hidden glass-floating">
                  {f.hero && <img src={f.hero} alt={f.name} className="w-full h-full object-cover" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
                <p className="text-[12px] font-bold text-gray-900 mt-2 px-0.5">{f.name}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Floating cart bar ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-[80px] left-0 right-0 max-w-md mx-auto px-3 z-40">
          <div className="glass-overlay rounded-[20px] px-4 py-3 shadow-xl border border-white/70">
            <button onClick={() => navigate(SCREENS.GIFTS)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 btn-primary-luxury rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {cartCount} item{cartCount !== 1 ? 's' : ''} · <span className="text-gray-900 font-bold">₹ {cartTotal.toLocaleString('en-IN')}</span>
                </span>
              </div>
              <span className="px-4 py-2 rounded-full bg-gray-900 text-white text-[11px] font-bold">View Cart</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
