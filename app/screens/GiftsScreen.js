'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { SCREENS, api } from '../lib/constants'
import { ArrowLeft, Search, ShoppingBag, Plus, Minus, X, ChevronLeft, ChevronRight, SlidersHorizontal, Heart, Gift, Truck, ShieldCheck, Sparkles, Check, Package, Trash2, Boxes, Lock, ArrowRight, MailOpen } from 'lucide-react'

const BULK_CTA_IMG = 'https://ik.imagekit.io/jcp2urr7b/content/03_gifts_shop/04_bulk_order_cta/bulk_order_-LeEPQTyP.jpg'

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

const PAGE_SIZE = 8

// Some gift docs carry dirty category/occasion strings — a product name saved into
// the category field, or a value written twice ("Mother's DayMother's Day"). Collapse
// an exactly-doubled phrase and normalise whitespace so chips/filters stay clean.
const cleanTag = (s) => {
  if (!s || typeof s !== 'string') return ''
  let t = s.trim().replace(/\s+/g, ' ')
  const m = t.match(/^(.+?)\s?\1$/)
  if (m) t = m[1].trim()
  return t
}

export default function GiftsScreen() {
  const { gifts, giftCart, setGiftCart, giftMode, navigate, goBack, loadGifts, handleCreateGiftOrder, loading, user, pendingGiftId, setPendingGiftId } = useApp()
  const [search, setSearch] = useState('')
  const [giftsLoading, setGiftsLoading] = useState(false)
  const [selectedGift, setSelectedGift] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeOccasion, setActiveOccasion] = useState('All')
  const [priceRange, setPriceRange] = useState(0)
  const [sortBy, setSortBy] = useState('default')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showFilters, setShowFilters] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fd_wishlist') || '[]') } catch { return [] }
  })
  const catScrollRef = useRef(null)
  const [giftCats, setGiftCats] = useState([])

  useEffect(() => {
    if (gifts.length === 0) {
      setGiftsLoading(true)
      loadGifts().finally(() => setGiftsLoading(false))
    }
    api('gift-categories').then(d => { if (Array.isArray(d)) setGiftCats(d) })
  }, [])

  // Auto-open a specific gift's detail when arriving from Home
  useEffect(() => {
    if (!pendingGiftId || gifts.length === 0) return
    const g = gifts.find(x => x.id === pendingGiftId)
    if (g) { setSelectedGift(g); setGalleryIndex(0) }
    setPendingGiftId(null)
  }, [pendingGiftId, gifts])

  // Persist wishlist
  useEffect(() => {
    try { localStorage.setItem('fd_wishlist', JSON.stringify(wishlist)) } catch {}
  }, [wishlist])

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Dynamic categories & occasions from gift data — sanitised so junk values
  // (product names mis-saved as a category, or doubled strings) never surface.
  const categories = useMemo(() => {
    const counts = {}
    for (const g of gifts) {
      const c = cleanTag(g.category)
      if (c && c.length <= 22) counts[c] = (counts[c] || 0) + 1
    }
    // A real category recurs; a one-off is almost always a mislabelled product name.
    const cats = Object.keys(counts)
      .filter(c => counts[c] >= 2)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .slice(0, 8)
    return ['All', ...cats]
  }, [gifts])

  const occasions = useMemo(() => {
    const counts = {}
    for (const g of gifts) {
      const o = cleanTag(g.occasion)
      if (o && o.length <= 22) counts[o] = (counts[o] || 0) + 1
    }
    const occs = Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      .slice(0, 10)
    return ['All', ...occs]
  }, [gifts])

  const searchLower = useMemo(() => search.toLowerCase(), [search])
  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceRange]
    return gifts
      .filter(g => {
        if (searchLower && !(g.name || '').toLowerCase().includes(searchLower) && !(g.description || '').toLowerCase().includes(searchLower)) return false
        if (activeCategory !== 'All' && cleanTag(g.category) !== activeCategory) return false
        if (activeOccasion !== 'All' && cleanTag(g.occasion) !== activeOccasion) return false
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

  // Any filter/search change restarts paging from the first page.
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [searchLower, activeCategory, activeOccasion, priceRange, sortBy])

  const visibleGifts = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])

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
            <p className="eyebrow text-gray-400">{giftMode === 'addon' ? 'Add-on' : 'Shop'}</p>
            <h1 className="font-display text-2xl text-gray-900 leading-tight">{giftMode === 'addon' ? 'Add gifts to decor' : 'Gifts & Hampers'}</h1>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="relative w-9 h-9 flex items-center justify-center rounded-xl glass-card active:scale-95 transition-transform">
            <SlidersHorizontal className="w-4 h-4 text-gray-700" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          {cartCount > 0 && (
            <button onClick={() => setShowCart(true)}
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
            placeholder="Search gifts, hampers, return gifts..."
            className="w-full pl-9 pr-9 py-2.5 bg-white/70 border border-white/80 rounded-2xl text-sm outline-none text-gray-800 placeholder-gray-400 focus:border-pink-300" />
          {search.length > 0 && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Category chips — only when the data has real, recurring categories */}
        {categories.length > 1 && (
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
        )}
      </div>

      {/* ── Discovery: categories, bulk, private (standalone mode, not while searching) ── */}
      {giftMode !== 'addon' && !search && (
        <div className="px-4 pt-4 space-y-4">
          {/* Browse by category — real content-pack images */}
          {giftCats.length > 0 && (
            <div>
              <p className="eyebrow text-gray-500 mb-2">Browse by category</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
                {giftCats.map(c => (
                  <button key={c.id}
                    onClick={() => {
                      const match = categories.find(cat => cat !== 'All' && (c.name.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(c.name.split(' ')[0].toLowerCase())))
                      if (match) setActiveCategory(match)
                      else setSearch(c.name.split(' ')[0])
                    }}
                    className="flex-shrink-0 w-32 text-left">
                    <div className="relative w-32 h-32 rounded-[20px] overflow-hidden glass-card">
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <div className={`absolute top-2 left-2 w-7 h-7 rounded-full ${c.accent || 'accent-pink'} border-2 border-white flex items-center justify-center`}>
                        <Gift className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-800 mt-1.5 leading-tight">{c.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Gift Builder card */}
          <button onClick={() => navigate(SCREENS.GIFT_BUILDER)} className="w-full glass-floating rounded-[26px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 transition-transform">
            <div className="relative w-14 h-14 rounded-2xl iridescent aurora-shimmer flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
              <div className="absolute inset-0 rounded-2xl iridescent opacity-50 blur-md -z-10" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-pink-600">AI POWERED</p>
              <h3 className="text-gray-900 font-bold text-[15px] mt-0.5">Let AI Create Your Gift Box</h3>
              <p className="text-gray-500 text-[11px] mt-0.5">Occasion + quantity + budget · gift suggestions</p>
            </div>
            <div className="px-3.5 py-2.5 rounded-full bg-gray-900 flex items-center gap-1.5 flex-shrink-0">
              <span className="text-white text-[11px] font-bold">Start</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
            </div>
          </button>

          {/* Bulk gifts card */}
          <button onClick={() => navigate(SCREENS.BULK)} className="w-full glass-floating rounded-[24px] overflow-hidden text-left hover:-translate-y-0.5 transition-transform">
            <div className="relative aspect-video">
              <img src={BULK_CTA_IMG} alt="Bulk gifts" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <span className="absolute top-3 left-3 glass-overlay px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest text-gray-900">FROM 20 UNITS</span>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-[9px] font-bold tracking-[0.2em] text-white/80 mb-0.5">FOR BIRTHDAYS · OFFICES · FESTIVALS</p>
                <h3 className="font-display text-xl text-white leading-tight">Bulk Gifts Starting from 20 Units</h3>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-white/80">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-bold text-gray-900">Plan Bulk Order</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-700" />
            </div>
          </button>

          {/* Private collection teaser */}
          <button onClick={() => navigate(SCREENS.PRIVATE)} className="w-full rounded-[24px] p-4 flex items-center gap-3 text-left relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#1a1126 0%,#2c1a3a 50%,#3d2150 100%)' }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,197,137,0.3), transparent 70%)', filter: 'blur(20px)' }} />
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#E5C589,#C9A45B)' }}>
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold tracking-[0.25em]" style={{ color: '#E5C589' }}>PREMIUM MEMBERS ONLY</p>
              <h3 className="font-display text-base text-white leading-tight mt-0.5">Private Premium Collection</h3>
              <p className="text-[10px] text-white/50 mt-0.5">Exclusive · not shown to everyone</p>
            </div>
            <span className="flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold" style={{ border: '1px solid #E5C589', color: '#E5C589' }}>Request access</span>
          </button>

          {/* AI Invitation Studio card */}
          <button onClick={() => navigate(SCREENS.INVITATIONS)} className="w-full glass-floating rounded-[24px] p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 transition-transform">
            <div className="w-12 h-12 rounded-2xl accent-lavender flex items-center justify-center flex-shrink-0">
              <MailOpen className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-pink-600">AI STUDIO</p>
              <h3 className="text-gray-900 font-bold text-[15px] mt-0.5">AI Invitation Studio</h3>
              <p className="text-gray-500 text-[11px] mt-0.5">WhatsApp · print · event-share invites</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-700 flex-shrink-0" strokeWidth={2.4} />
          </button>
        </div>
      )}

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
      <div className={`flex-1 p-4 grid grid-cols-2 gap-3 ${cartCount > 0 ? 'pb-56' : 'pb-28'}`}>

        {giftsLoading && Array.from({ length: 6 }).map((_, i) => <GiftSkeleton key={i} />)}

        {!giftsLoading && visibleGifts.map(gift => {
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
                {cleanTag(gift.occasion) && <p className="text-pink-600 text-[10px] font-bold tracking-wide uppercase mb-1">{cleanTag(gift.occasion)}</p>}
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

        {/* Paging — stop the endless scroll; reveal a page at a time */}
        {!giftsLoading && filtered.length > visibleCount && (
          <div className="col-span-2 flex flex-col items-center gap-2 pt-2 pb-1">
            <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="px-6 py-3 rounded-full glass-floating text-sm font-bold text-gray-800 active:scale-[0.97] transition-transform">
              Load more gifts
            </button>
            <p className="text-[11px] text-gray-400">Showing {visibleCount} of {filtered.length}</p>
          </div>
        )}
        {!giftsLoading && filtered.length > PAGE_SIZE && filtered.length <= visibleCount && (
          <p className="col-span-2 text-center text-[11px] text-gray-400 pt-2 pb-1">That&apos;s all {filtered.length} gifts</p>
        )}

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

      {/* Bottom cart bar — floats ABOVE the bottom nav, tap to edit */}
      {cartCount > 0 && !selectedGift && (
        <div className="fixed bottom-[80px] left-0 right-0 max-w-md mx-auto px-3 z-40">
          <div className="glass-overlay rounded-[20px] px-4 pt-3 pb-3 shadow-xl border border-white/70">
            <button onClick={() => setShowCart(true)} className="w-full flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 btn-primary-luxury rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">{cartCount} item{cartCount !== 1 ? 's' : ''} · <span className="text-pink-600 font-bold">edit</span></span>
              </div>
              <span className="text-base font-bold text-gray-900">₹ {cartTotal.toLocaleString('en-IN')}</span>
            </button>
            <button onClick={handleProceed} disabled={loading}
              className="w-full btn-primary-luxury text-white font-bold py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform disabled:opacity-60">
              {loading ? 'Processing...' : giftMode === 'addon'
                ? `Add to Decoration · ₹ ${cartTotal.toLocaleString('en-IN')}`
                : `Proceed to Book · ₹ ${cartTotal.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      )}

      {/* Cart drawer — editable */}
      {showCart && (
        <div className="fixed inset-0 z-[55] flex items-end justify-center" onClick={() => setShowCart(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative glass-overlay w-full max-w-md rounded-t-[28px] max-h-[82vh] flex flex-col" style={{ animation: 'sheetSlideUp 0.3s cubic-bezier(0.32,0.72,0,1)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
            <div className="px-5 pb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow text-gray-500">Your cart</p>
                <h2 className="font-display text-2xl text-gray-900">{cartCount} item{cartCount !== 1 ? 's' : ''}</h2>
              </div>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center"><X className="w-4 h-4 text-gray-600" /></button>
            </div>
            <div className="px-4 overflow-y-auto flex-1 space-y-2.5 pb-2">
              {giftCart.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Your cart is empty</p>}
              {giftCart.map(item => {
                const g = gifts.find(x => x.id === item.gift_id)
                const src = getImgSrc(item.image_url || (g && (g.images?.[0] || g.image_url)), 'thumb')
                return (
                  <div key={item.gift_id} className="glass-card rounded-2xl p-2.5 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-pink-50/50 shrink-0">
                      {src ? <img src={src} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Gift className="w-6 h-6 text-pink-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                      <p className="text-sm font-bold text-pink-600 mt-0.5">₹ {(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button onClick={() => setGiftCart(prev => prev.filter(x => x.gift_id !== item.gift_id))} className="text-gray-300 hover:text-red-500 active:scale-90 transition-transform"><Trash2 className="w-4 h-4" /></button>
                      <div className="flex items-center gap-1 bg-pink-50/80 rounded-full p-0.5">
                        <button onClick={() => g ? updateCart(g, -1) : setGiftCart(prev => prev.map(x => x.gift_id === item.gift_id ? { ...x, quantity: x.quantity - 1 } : x).filter(x => x.quantity > 0))} className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm active:scale-90 transition-transform"><Minus className="w-3.5 h-3.5 text-pink-500" /></button>
                        <span className="text-sm font-bold text-pink-600 w-5 text-center">{item.quantity}</span>
                        <button onClick={() => g && updateCart(g, 1)} className="w-7 h-7 flex items-center justify-center btn-primary-luxury rounded-full active:scale-90 transition-transform"><Plus className="w-3.5 h-3.5 text-white" /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-4 pt-3 pb-6 border-t border-white/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-xl font-bold text-gray-900">₹ {cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <button onClick={() => { setShowCart(false); handleProceed() }} disabled={loading || cartCount === 0}
                className="w-full btn-primary-luxury text-white font-bold py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform disabled:opacity-50">
                {giftMode === 'addon' ? 'Add to Decoration' : 'Proceed to Book'} · ₹ {cartTotal.toLocaleString('en-IN')}
              </button>
            </div>
          </div>
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
          <div data-gift-scroll className="fixed inset-0 z-[55] bg-aurora overflow-y-auto">
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
