'use client'
import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'
import { ArrowLeft, Search, ShoppingBag, Plus, Minus, X } from 'lucide-react'

function GiftSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="w-full h-36 bg-pink-50" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        <div className="h-8 bg-gray-100 rounded-xl mt-3" />
      </div>
    </div>
  )
}

export default function GiftsScreen() {
  const { gifts, giftCart, setGiftCart, giftMode, navigate, goBack, loadGifts, handleCreateGiftOrder, loading, user } = useApp()
  const [search, setSearch] = useState('')
  const [giftsLoading, setGiftsLoading] = useState(false)

  useEffect(() => {
    if (gifts.length === 0) {
      setGiftsLoading(true)
      loadGifts().finally(() => setGiftsLoading(false))
    }
  }, [])

  const searchLower = useMemo(() => search.toLowerCase(), [search])
  const filtered = useMemo(
    () => gifts.filter(g => (g.name || '').toLowerCase().includes(searchLower)),
    [gifts, searchLower]
  )

  const getQty = (id) => (giftCart.find(g => g.gift_id === id)?.quantity || 0)

  const updateCart = (gift, delta) => {
    setGiftCart(prev => {
      const existing = prev.find(g => g.gift_id === gift.id)
      const newQty = (existing?.quantity || 0) + delta
      if (newQty <= 0) return prev.filter(g => g.gift_id !== gift.id)
      if (newQty > 10) return prev // cap at 10 per gift
      if (existing) return prev.map(g => g.gift_id === gift.id ? { ...g, quantity: newQty } : g)
      return [...prev, { gift_id: gift.id, name: gift.name, price: gift.price, quantity: 1, image_url: gift.image_url }]
    })
  }

  const cartTotal = useMemo(() => giftCart.reduce((s, g) => s + g.price * g.quantity, 0), [giftCart])
  const cartCount = useMemo(() => giftCart.reduce((s, g) => s + g.quantity, 0), [giftCart])

  const handleProceed = () => {
    if (!user) { navigate(SCREENS.AUTH); return }
    if (giftMode === 'standalone') handleCreateGiftOrder()
    else goBack()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="gradient-pink px-4 pt-12 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/20 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">🎁 Gifts</h1>
            <p className="text-white/70 text-xs">Bouquets, flowers & arrangements</p>
          </div>
          {cartCount > 0 && (
            <button
              onClick={handleProceed}
              className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl active:scale-95 transition-transform shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-bold text-pink-600">{cartCount}</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search gifts..."
            className="w-full pl-9 pr-9 py-2.5 bg-white rounded-xl text-sm outline-none text-gray-800 placeholder-gray-400"
          />
          {search.length > 0 && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 pb-36 grid grid-cols-2 gap-3">

        {/* Skeleton while loading */}
        {giftsLoading && Array.from({ length: 6 }).map((_, i) => <GiftSkeleton key={i} />)}

        {/* Gift cards */}
        {!giftsLoading && filtered.map(gift => {
          const qty = getQty(gift.id)
          const imgSrc = gift.image_url?.includes('ik.imagekit.io')
            ? `${gift.image_url}?tr=w-400,h-300,q-80,c-maintain_ratio`
            : gift.image_url
          return (
            <div key={gift.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">

              {/* Image */}
              <div className="relative w-full h-36 bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center shrink-0">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={gift.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { e.target.onerror = null; e.target.style.display = 'none' }}
                  />
                ) : (
                  <span className="text-4xl">🎁</span>
                )}
                {/* Price badge */}
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                  <span className="text-xs font-bold text-pink-600">₹{gift.price.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-2 mb-1">{gift.name}</p>
                {gift.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-auto">{gift.description}</p>
                )}

                {/* Add / stepper */}
                <div className="mt-3">
                  {qty === 0 ? (
                    <button
                      onClick={() => updateCart(gift, 1)}
                      className="w-full py-2 gradient-pink text-white text-sm font-bold rounded-xl active:scale-95 transition-transform shadow-sm shadow-pink-200"
                    >
                      Add
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-pink-50 rounded-xl p-1">
                      <button
                        onClick={() => updateCart(gift, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm active:scale-90 transition-transform"
                      >
                        <Minus className="w-4 h-4 text-pink-500" />
                      </button>
                      <span className="text-sm font-bold text-pink-600 w-6 text-center">{qty}</span>
                      <button
                        onClick={() => updateCart(gift, 1)}
                        className="w-8 h-8 flex items-center justify-center gradient-pink rounded-lg shadow-sm active:scale-90 transition-transform"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {!giftsLoading && filtered.length === 0 && gifts.length > 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-5xl mb-3">🔍</span>
            <p className="font-semibold text-gray-500">No gifts found</p>
            <p className="text-xs mt-1">Try a different search</p>
          </div>
        )}
        {!giftsLoading && gifts.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-5xl mb-3">🎁</span>
            <p className="font-semibold text-gray-500">No gifts available</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-8 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 gradient-pink rounded-full flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-base font-bold text-gray-900">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full gradient-pink text-white font-bold py-3.5 rounded-2xl text-sm shadow-pink active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? 'Processing...' : giftMode === 'addon'
              ? `Add to Decoration · ₹${cartTotal.toLocaleString('en-IN')}`
              : `Proceed to Book · ₹${cartTotal.toLocaleString('en-IN')}`}
          </button>
        </div>
      )}
    </div>
  )
}
