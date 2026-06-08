'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'
import { ArrowLeft, Search, ShoppingBag, Plus, Minus, X, ChevronLeft, ChevronRight, SlidersHorizontal, Heart, Gift, Truck, ShieldCheck, Sparkles, Check, Package } from 'lucide-react'

function GiftSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="w-full h-36 bg-pink-50/60" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        <div className="h-8 bg-gray-100 rounded-xl mt-3" />
      </div>
    </div>
  )
}

const PRICE_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under 500', min: 0, max: 500 },
  { label: '500-1000', min: 500, max: 1000 },
  { label: '1000-2000', min: 1000, max: 2000 },
  { label: '2000+', min: 2000, max: Infinity },
]

const SORT_OPTIONS = [
  { label: 'Recommended', value: 'default' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First', value: 'newest' },
]

export default function GiftsScreen() {
  const { gifts, giftCart, setGiftCart, giftMode, navigate, goBack, loadGifts, handleCreateGiftOrder, loading, user } = useApp()
  const [search, setSearch] = useState('')
  const [giftsLoading, setGiftsLoading] = useState(false)
  const [selectedGift, setSelectedGift] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeOccasion, setActiveOccasion] = useState('All')
  const [priceRange, setPriceRange] = useState(0)
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fd_wishlist') || '[]') } catch { return [] }
  })
  const catScrollRef = useRef(null)

  useEffect(() => {
    if (gifts.length === 0) {
      setGiftsLoading(true)
      loadGifts().finally(() => setGiftsLoading(false))
    }
  }, [])

  // Persist wishlist
  useEffect(() => {
    try { localStorage.setItem('fd_wishlist', JSON.stringify(wishlist)) } catch {}
  }, [wishlist])

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Dynamic categories & occasions from gift data
  const categories = useMemo(() => {
    const cats = [...new Set(gifts.map(g => g.category).filter(Boolean))].sort()
    return ['All', ...cats]
  }, [gifts])

  const occasions = useMemo(() => {
    const occs = [...new Set(gifts.map(g => g.occasion).filter(Boolean))].sort()
    return ['All', ...occs]
  }, [gifts])

  const searchLower = useMemo(() => search.toLowerCase(), [search])
  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceRange]
    return gifts
      .filter(g => {
        if (searchLower && !(g.name || '').toLowerCase().includes(searchLower) && !(g.description || '').toLowerCase().includes(searchLower)) return false
        if (activeCategory !== 'All' && g.category !== activeCategory) return false
        if (activeOccasion !== 'All' && g.occasion !== activeOccasion) return false
        if (g.price < range.min || g.price > range.max) return false
        return true
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_asc': return (a.price || 0) - (b.price || 0)
          case 'price_desc': return (b.price || 0) - (a.price || 0)
          case 'newest': return new Date(b.created_at || 0) - new Date(a.created_at || 0)
          default: return 0
        }
      })
  }, [gifts, searchLower, activeCategory, activeOccasion, priceRange, sortBy])

  const getQty = (id) => (giftCart.find(g => g.gift_id === id)?.quantity || 0)

  const updateCart = (gift, delta) => {
    if ((gift.stock !== undefined && gift.stock <= 0) && delta > 0) return
    setGiftCart(prev => {
      const existing = prev.find(g => g.gift_id === gift.id)
      const newQty = (existing?.quantity || 0) + delta
      if (newQty <= 0) return prev.filter(g => g.gift_id !== gift.id)
      if (newQty > 10) return prev
      if (gift.stock !== undefined && newQty > gift.stock) return prev
      if (existing) return prev.map(g => g.gift_id === gift.id ? { ...g, quantity: newQty } : g)
      return [...prev, { gift_id: gift.id, name: gift.name, price: gift.price, quantity: 1, image_url: gift.images?.[0] || gift.image_url }]
    })
  }

  const cartTotal = useMemo(() => giftCart.reduce((s, g) => s + g.price * g.quantity, 0), [giftCart])
  const cartCount = useMemo(() => giftCart.reduce((s, g) => s + g.quantity, 0), [giftCart])

  const handleProceed = () => {
    if (!user) { navigate(SCREENS.AUTH); return }
    if (giftMode === 'standalone') handleCreateGiftOrder()
    else goBack()
  }

  const isOutOfStock = (gift) => gift.stock !== undefined && gift.stock <= 0

  const getImgs = (gift) => {
    if (gift?.images?.length) return gift.images
    if (gift?.image_url) return [gift.image_url]
    return []
  }

  const getImgSrc = (url, size = 'large') => {
    if (!url?.includes('ik.imagekit.io')) return url
    return size === 'thumb'
      ? `${url}?tr=w-400,h-300,q-80,c-maintain_ratio`
      : `${url}?tr=w-800,h-600,q-85,c-maintain_ratio`
  }

  const activeFilterCount = (activeCategory !== 'All' ? 1 : 0) + (activeOccasion !== 'All' ? 1 : 0) + (priceRange !== 0 ? 1 : 0) + (sortBy !== 'default' ? 1 : 0)

  return (
    <div className="min-h-screen bg-aurora flex flex-col">

      {/* Header */}
      <div className="glass-overlay px-4 pt-12 pb-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl glass-card active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-gray-400">{giftMode === 'addon' ? 'Add-on' : 'Boutique'}</p>
            <h1 className="font-display text-2xl text-gray-900 leading-tight">{giftMode === 'addon' ? 'Add gifts to decor' : 'Gifts'}</h1>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="relative w-9 h-9 flex items-center justify-center rounded-xl glass-card active:scale-95 transition-transform">
            <SlidersHorizontal className="w-4 h-4 text-gray-700" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          {cartCount > 0 && (
            <button onClick={handleProceed}
              className="flex items-center gap-1.5 btn-primary-luxury px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">{cartCount}</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gifts, bouquets, combos..."
            className="w-full pl-9 pr-9 py-2.5 bg-white/70 border border-white/80 rounded-2xl text-sm outline-none text-gray-800 placeholder-gray-400 focus:border-pink-300" />
          {search.length > 0 && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div ref={catScrollRef} className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'btn-primary-luxury text-white'
                  : 'bg-white/60 text-gray-600 border border-white/80'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="glass-card border-b border-white/60 px-4 py-4 space-y-4">
          {/* Occasion */}
          {occasions.length > 1 && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Occasion</p>
              <div className="flex flex-wrap gap-1.5">
                {occasions.map(o => (
                  <button key={o} onClick={() => setActiveOccasion(o)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeOccasion === o ? 'bg-pink-500 text-white' : 'bg-white/60 text-gray-600 border border-white/80'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Price range */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">Price Range</p>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_RANGES.map((r, i) => (
                <button key={i} onClick={() => setPriceRange(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    priceRange === i ? 'bg-pink-500 text-white' : 'bg-white/60 text-gray-600 border border-white/80'}`}>
                  {r.label === 'All' ? 'All Prices' : `Rs ${r.label}`}
                </button>
              ))}
            </div>
          </div>
          {/* Sort */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">Sort By</p>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map(s => (
                <button key={s.value} onClick={() => setSortBy(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    sortBy === s.value ? 'bg-pink-500 text-white' : 'bg-white/60 text-gray-600 border border-white/80'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {/* Clear */}
          {activeFilterCount > 0 && (
            <button onClick={() => { setActiveCategory('All'); setActiveOccasion('All'); setPriceRange(0); setSortBy('default') }}
              className="text-xs text-pink-500 font-bold">Clear all filters</button>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 p-4 pb-36 grid grid-cols-2 gap-3">

        {giftsLoading && Array.from({ length: 6 }).map((_, i) => <GiftSkeleton key={i} />)}

        {!giftsLoading && filtered.map(gift => {
          const qty = getQty(gift.id)
          const imgs = getImgs(gift)
          const imgSrc = getImgSrc(imgs[0], 'thumb')
          const outOfStock = isOutOfStock(gift)
          const lowStock = !outOfStock && gift.stock !== undefined && gift.stock > 0 && gift.stock < 5
          return (
            <div key={gift.id} className={`glass-floating rounded-[24px] overflow-hidden flex flex-col transition-transform active:scale-[0.98] ${outOfStock ? 'opacity-70' : ''}`}>

              {/* Image */}
              <div onClick={() => { setSelectedGift(gift); setGalleryIndex(0) }} className="relative aspect-square cursor-pointer bg-gradient-to-br from-pink-50 to-rose-100">
                {imgSrc ? (
                  <img src={imgSrc} alt={gift.name} className="w-full h-full object-cover" loading="lazy"
                    onError={e => { e.target.onerror = null; e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Gift className="w-9 h-9 text-pink-300" /></div>
                )}
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(gift.id) }}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full glass-overlay flex items-center justify-center active:scale-90 transition-transform">
                  <Heart className={`w-3.5 h-3.5 ${wishlist.includes(gift.id) ? 'fill-pink-600 text-pink-600' : 'text-gray-600'}`} strokeWidth={2.2} />
                </button>
                {imgs.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-black/45 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">+{imgs.length - 1}</span>
                )}
                {lowStock && (
                  <span className="absolute top-3 left-3 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Only {gift.stock} left</span>
                )}
                {outOfStock && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="bg-white/95 text-red-500 text-xs font-bold px-3 py-1.5 rounded-full">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3.5 flex flex-col flex-1">
                {gift.occasion && <p className="text-pink-600 text-[10px] font-bold tracking-wide uppercase mb-1">{gift.occasion}</p>}
                <h4 onClick={() => { setSelectedGift(gift); setGalleryIndex(0) }}
                  className="text-gray-900 font-bold text-[13px] leading-tight mb-2 line-clamp-2 min-h-[34px] cursor-pointer">{gift.name}</h4>
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <p className="text-gray-900 text-base font-bold">₹ {gift.price?.toLocaleString('en-IN')}</p>
                  {outOfStock ? (
                    <span className="text-[10px] font-bold text-gray-400">Sold out</span>
                  ) : qty === 0 ? (
                    <button onClick={() => updateCart(gift, 1)}
                      className="w-9 h-9 rounded-full btn-primary-luxury flex items-center justify-center active:scale-90 transition-transform">
                      <Plus className="w-4 h-4 text-white" strokeWidth={2.6} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-pink-50/80 rounded-full p-0.5">
                      <button onClick={() => updateCart(gift, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm active:scale-90 transition-transform"><Minus className="w-3.5 h-3.5 text-pink-500" /></button>
                      <span className="text-sm font-bold text-pink-600 w-5 text-center">{qty}</span>
                      <button onClick={() => updateCart(gift, 1)} className="w-7 h-7 flex items-center justify-center btn-primary-luxury rounded-full active:scale-90 transition-transform"><Plus className="w-3.5 h-3.5 text-white" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {!giftsLoading && filtered.length === 0 && gifts.length > 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-gray-400">
            <Search className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-semibold text-gray-500">No gifts found</p>
            <p className="text-xs mt-1">Try a different search or filter</p>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); setActiveOccasion('All'); setPriceRange(0) }}
              className="mt-3 text-sm text-pink-500 font-bold">Clear all filters</button>
          </div>
        )}
        {!giftsLoading && gifts.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-gray-400">
            <Gift className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-semibold text-gray-500">No gifts available</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-overlay px-4 pt-3 pb-8 z-40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 btn-primary-luxury rounded-full flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-base font-bold text-gray-900">Rs {cartTotal.toLocaleString('en-IN')}</span>
          </div>
          <button onClick={handleProceed} disabled={loading}
            className="w-full btn-primary-luxury text-white font-bold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform disabled:opacity-60">
            {loading ? 'Processing...' : giftMode === 'addon'
              ? `Add to Decoration · Rs ${cartTotal.toLocaleString('en-IN')}`
              : `Proceed to Book · Rs ${cartTotal.toLocaleString('en-IN')}`}
          </button>
        </div>
      )}

      {/* ── Gift Detail Bottom Sheet with Carousel ── */}
      {selectedGift && (() => {
        const qty = getQty(selectedGift.id)
        const imgs = getImgs(selectedGift)
        const outOfStock = isOutOfStock(selectedGift)
        const recRelated = gifts.filter(g => g.id !== selectedGift.id && (g.active !== false && g.is_active !== false) && (g.category === selectedGift.category || g.occasion === selectedGift.occasion))
        const recommended = (recRelated.length >= 2 ? recRelated : gifts.filter(g => g.id !== selectedGift.id && (g.active !== false && g.is_active !== false))).slice(0, 8)
        const HIGHLIGHTS = [
          { icon: Truck,       label: 'Same-day delivery' },
          { icon: ShieldCheck, label: 'Quality assured' },
          { icon: Gift,        label: 'Gift wrapped' },
          { icon: Sparkles,    label: 'Hand curated' },
        ]
        return (
          <div data-gift-scroll className="fixed inset-0 z-50 bg-aurora overflow-y-auto">
            <div className="max-w-md mx-auto min-h-full pb-28">
              {/* Top bar */}
              <div className="sticky top-0 z-20 glass-overlay px-4 py-3 flex items-center justify-between">
                <button onClick={() => setSelectedGift(null)} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center active:scale-90 transition-transform">
                  <ChevronLeft className="w-5 h-5 text-gray-800" strokeWidth={2.2} />
                </button>
                <p className="eyebrow text-gray-500">Gift detail</p>
                <button onClick={() => toggleWishlist(selectedGift.id)} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center active:scale-90 transition-transform">
                  <Heart className={`w-4 h-4 ${wishlist.includes(selectedGift.id) ? 'fill-pink-600 text-pink-600' : 'text-gray-600'}`} strokeWidth={2.2} />
                </button>
              </div>

              {/* Hero carousel */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-pink-50 to-rose-100">
                {imgs.length > 0 ? (
                  <img src={getImgSrc(imgs[galleryIndex])} alt={selectedGift.name}
                    className="w-full h-full object-cover transition-opacity duration-200"
                    onError={e => { e.target.onerror = null; e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Gift className="w-16 h-16 text-pink-300" /></div>
                )}
                {imgs.length > 1 && (
                  <>
                    <button onClick={() => setGalleryIndex(i => (i - 1 + imgs.length) % imgs.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 glass-overlay rounded-full flex items-center justify-center active:scale-90 transition">
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <button onClick={() => setGalleryIndex(i => (i + 1) % imgs.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 glass-overlay rounded-full flex items-center justify-center active:scale-90 transition">
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imgs.map((_, i) => (
                        <button key={i} onClick={() => setGalleryIndex(i)}
                          className={`h-2 rounded-full transition-all ${i === galleryIndex ? 'bg-white w-5' : 'bg-white/50 w-2'}`} />
                      ))}
                    </div>
                  </>
                )}
                {outOfStock && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Out of Stock</div>
                )}
              </div>

              {/* Thumbnail strip */}
              {imgs.length > 1 && (
                <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
                  {imgs.map((url, i) => (
                    <button key={i} onClick={() => setGalleryIndex(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === galleryIndex ? 'border-pink-500 scale-105' : 'border-white/70 opacity-70 hover:opacity-100'}`}>
                      <img src={getImgSrc(url, 'thumb')} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="px-5 pt-4">
                {selectedGift.occasion && <p className="text-pink-600 text-[10px] font-bold tracking-widest uppercase mb-1">{selectedGift.occasion}</p>}
                <h2 className="font-display text-3xl text-gray-900 leading-tight">{selectedGift.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900">₹ {selectedGift.price?.toLocaleString('en-IN')}</span>
                  {!outOfStock && (selectedGift.stock === undefined || selectedGift.stock > 5) && <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">In stock</span>}
                  {!outOfStock && selectedGift.stock !== undefined && selectedGift.stock > 0 && selectedGift.stock <= 5 && <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Only {selectedGift.stock} left</span>}
                </div>

                {/* meta tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selectedGift.category && <span className="text-[10px] bg-white/70 border border-white/80 text-gray-600 font-semibold px-2.5 py-1 rounded-full">{selectedGift.category}</span>}
                  {selectedGift.colour && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-white/70 border border-white/80 text-gray-600 font-semibold px-2.5 py-1 rounded-full">
                      <span className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: selectedGift.colour }} />
                      {selectedGift.colour}
                    </span>
                  )}
                </div>

                {/* highlights */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {HIGHLIGHTS.map((h, i) => (
                    <div key={i} className="glass-card rounded-2xl px-3 py-2.5 flex items-center gap-2">
                      <h.icon className="w-4 h-4 text-pink-500 shrink-0" strokeWidth={2.2} />
                      <span className="text-[11px] font-semibold text-gray-700">{h.label}</span>
                    </div>
                  ))}
                </div>

                {/* description */}
                {selectedGift.description && (
                  <div className="glass-floating rounded-[22px] p-4 mt-5">
                    <p className="eyebrow text-gray-500 mb-1.5">About this gift</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedGift.description}</p>
                  </div>
                )}
              </div>

              {/* Recommended */}
              {recommended.length > 0 && (
                <section className="mt-8">
                  <div className="px-5 mb-3">
                    <p className="eyebrow text-gray-600">Curated for you</p>
                    <h3 className="font-display text-2xl font-medium text-gray-900 mt-1">You may also <span className="italic iridescent-text">like</span></h3>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-5">
                    {recommended.map(g => {
                      const rImg = getImgSrc(getImgs(g)[0], 'thumb')
                      return (
                        <button key={g.id} onClick={() => { setSelectedGift(g); setGalleryIndex(0); const el = document.querySelector('[data-gift-scroll]'); if (el) el.scrollTop = 0 }}
                          className="flex-shrink-0 w-40 glass-floating rounded-[22px] overflow-hidden text-left hover:-translate-y-1 transition-transform">
                          <div className="aspect-square bg-pink-50/50">
                            {rImg ? <img src={rImg} alt={g.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Gift className="w-7 h-7 text-pink-300" /></div>}
                          </div>
                          <div className="p-3">
                            {g.occasion && <p className="text-pink-600 text-[9px] font-bold tracking-wide uppercase mb-0.5">{g.occasion}</p>}
                            <p className="text-gray-900 font-bold text-[12px] leading-tight line-clamp-2 min-h-[30px]">{g.name}</p>
                            <p className="text-gray-900 text-sm font-bold mt-1">₹ {g.price?.toLocaleString('en-IN')}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>

            {/* Sticky add-to-cart bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto glass-overlay px-4 pt-3 pb-6">
              {outOfStock ? (
                <div className="w-full py-3.5 bg-gray-100 text-gray-400 font-bold rounded-2xl text-sm text-center">Currently Unavailable</div>
              ) : qty === 0 ? (
                <button onClick={() => updateCart(selectedGift, 1)}
                  className="w-full py-3.5 btn-primary-luxury text-white font-bold rounded-2xl active:scale-[0.98] transition-transform text-sm flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Add to Cart · ₹ {selectedGift.price?.toLocaleString('en-IN')}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-pink-50/80 rounded-2xl p-1.5">
                    <button onClick={() => updateCart(selectedGift, -1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm active:scale-90 transition-transform"><Minus className="w-4 h-4 text-pink-500" /></button>
                    <span className="text-base font-black text-pink-600 min-w-[1.5rem] text-center">{qty}</span>
                    <button onClick={() => updateCart(selectedGift, 1)} className="w-9 h-9 flex items-center justify-center btn-primary-luxury rounded-xl active:scale-90 transition-transform"><Plus className="w-4 h-4 text-white" /></button>
                  </div>
                  <button onClick={handleProceed} disabled={loading}
                    className="flex-1 py-3.5 btn-primary-luxury text-white font-bold rounded-2xl active:scale-[0.98] transition-transform text-sm disabled:opacity-60">
                    {giftMode === 'addon' ? 'Add to Decoration' : `Checkout · ₹ ${cartTotal.toLocaleString('en-IN')}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
