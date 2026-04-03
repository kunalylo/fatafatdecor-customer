'use client'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'
import { ArrowLeft, Search, ShoppingBag, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GiftsScreen() {
  const { gifts, giftCart, setGiftCart, giftMode, navigate, goBack, loadGifts, handleCreateGiftOrder, loading, user } = useApp()
  const [search, setSearch] = useState('')

  useEffect(() => { if (gifts.length === 0) loadGifts() }, [])

  const filtered = gifts.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

  const getQty = (id) => (giftCart.find(g => g.gift_id === id)?.quantity || 0)

  const updateCart = (gift, delta) => {
    setGiftCart(prev => {
      const existing = prev.find(g => g.gift_id === gift.id)
      const newQty = (existing?.quantity || 0) + delta
      if (newQty <= 0) return prev.filter(g => g.gift_id !== gift.id)
      if (existing) return prev.map(g => g.gift_id === gift.id ? { ...g, quantity: newQty } : g)
      return [...prev, { gift_id: gift.id, name: gift.name, price: gift.price, quantity: 1, image_url: gift.image_url }]
    })
  }

  const cartTotal = giftCart.reduce((s, g) => s + g.price * g.quantity, 0)
  const cartCount = giftCart.reduce((s, g) => s + g.quantity, 0)

  const handleProceed = () => {
    if (!user) { navigate(SCREENS.AUTH); return }
    if (giftMode === 'standalone') handleCreateGiftOrder()
    else goBack()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Gifts</h1>
            <p className="text-xs text-gray-400">Bouquets, flowers & arrangements</p>
          </div>
          {cartCount > 0 && (
            <div className="flex items-center gap-1 bg-pink-50 border border-pink-100 px-3 py-1.5 rounded-xl">
              <ShoppingBag className="w-4 h-4 text-pink-500" />
              <span className="text-sm font-bold text-pink-600">{cartCount}</span>
            </div>
          )}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gifts..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-pink-300" />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 pb-36 grid grid-cols-2 gap-3">
        {filtered.map(gift => {
          const qty = getQty(gift.id)
          return (
            <div key={gift.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative">
                <img src={gift.image_url} alt={gift.name} className="w-full h-40 object-cover bg-pink-50"
                  onError={e => { e.target.style.background = '#fdf2f8'; e.target.src = '' }} />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold text-pink-600">
                  ₹{gift.price.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">{gift.name}</p>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{gift.description}</p>
                {qty === 0 ? (
                  <button onClick={() => updateCart(gift, 1)}
                    className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold rounded-xl transition-colors">
                    Add
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-pink-50 rounded-xl p-1">
                    <button onClick={() => updateCart(gift, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm">
                      <Minus className="w-4 h-4 text-pink-500" />
                    </button>
                    <span className="font-bold text-pink-600">{qty}</span>
                    <button onClick={() => updateCart(gift, 1)} className="w-8 h-8 flex items-center justify-center bg-pink-500 rounded-lg shadow-sm">
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🎁</p>
            <p className="font-medium">{search ? 'No gifts found' : 'Loading gifts...'}</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{cartCount} item{cartCount > 1 ? 's' : ''} selected</span>
            <span className="font-bold text-gray-800">₹{cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <Button onClick={handleProceed} disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-2xl text-base">
            {loading ? 'Processing...' : giftMode === 'addon'
              ? `Add to Decoration (₹${cartTotal.toLocaleString('en-IN')})`
              : `Proceed to Book (₹${cartTotal.toLocaleString('en-IN')})`}
          </Button>
        </div>
      )}
    </div>
  )
}
