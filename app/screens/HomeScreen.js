'use client'

import { useEffect, useState } from 'react'
import {
  Bell, MapPin, Heart, Sparkles, ArrowRight, ChevronDown, Wand2, Plus,
  Cake, Baby, PartyPopper, Home as HomeIcon, Briefcase, Flame, Package, Gift,
  Camera, CalendarCheck, IndianRupee, Loader2, ShieldCheck, Star, BadgeCheck,
  CalendarClock, Building2, FileText, Truck, Lock,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, api } from '../lib/constants'

const OCCASIONS = [
  { id: 'birthday',     name: 'Birthday',        icon: Cake,        accent: 'accent-peach',    occasion: 'birthday' },
  { id: 'anniversary',  name: 'Anniversary',     icon: Heart,       accent: 'accent-pink',     occasion: 'anniversary' },
  { id: 'baby-shower',  name: 'Baby Shower',     icon: Baby,        accent: 'accent-lavender', occasion: 'baby_shower' },
  { id: 'surprise',     name: 'Surprise Room',   icon: PartyPopper, accent: 'accent-pink',     occasion: 'party' },
  { id: 'housewarming', name: 'Housewarming',    icon: HomeIcon,    accent: 'accent-mint',     occasion: 'housewarming' },
  { id: 'corporate',    name: 'Corporate Setup', icon: Briefcase,   accent: 'accent-lavender', occasion: 'corporate' },
  { id: 'festival',     name: 'Festival Decor',  icon: Flame,       accent: 'accent-peach',    occasion: 'festival' },
  { id: 'romantic',     name: 'Romantic Setup',  icon: Sparkles,    accent: 'accent-pink',     occasion: 'anniversary' },
]

const TRENDING = [
  {
    id: 'trend-birthday',
    title: 'Elegant Birthday Celebration',
    category: 'Birthday Decor',
    accent: 'accent-peach',
    occasion: 'birthday',
    booked: 3,
    image: 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/03_trending_decorations/elegant_birthday_celebration_R-y1Ekkd9.jpg',
  },
  {
    id: 'trend-anniversary',
    title: 'Romantic Anniversary Setup',
    category: 'Anniversary Decor',
    accent: 'accent-pink',
    occasion: 'anniversary',
    booked: 2,
    image: 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/03_trending_decorations/romantic_anniversary_setup_40m64zJpb.jpg',
  },
  {
    id: 'trend-babyshower',
    title: 'Baby Shower Celebration',
    category: 'Baby Shower Decor',
    accent: 'accent-lavender',
    occasion: 'baby_shower',
    booked: 5,
    image: 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/03_trending_decorations/baby_shower_celebration_lkRvRboGZ.jpg',
  },
]

const ADD_GIFTS = [
  {
    id: 'return',
    name: 'Birthday Return Gifts',
    desc: 'Curated for birthdays & parties',
    accent: 'accent-peach',
    image: 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/05_add_gifts_to_your_celebration/add_gifts_birthday_return_gifts_FzMqKdNkj.jpg',
  },
  {
    id: 'baby',
    name: 'Baby Shower Gifts',
    desc: 'Pastel hampers · sweet treats',
    accent: 'accent-lavender',
    image: 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/05_add_gifts_to_your_celebration/add_gifts_baby_shower_gifts_J-l8sas6N.jpg',
  },
  {
    id: 'premium',
    name: 'Premium Gift Boxes',
    desc: 'Luxury · personalised',
    accent: 'accent-pink',
    image: 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/05_add_gifts_to_your_celebration/primium_gift_boxes_jpg_VACXO4qAq.jpg',
  },
  {
    id: 'balloon',
    name: 'Custom Balloon Gifts',
    desc: 'Themed bubbles + chocolates',
    accent: 'accent-pink',
    image: 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/05_add_gifts_to_your_celebration/custome_ballon_gift_jpg_0wxN4J7b9.jpg',
  },
]

const FOR_TWO_IMG = 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/07_for_two_romantic_anniversary_setup/for_two_romantic_anniversary_setup_tZlXpVP1y.jpg'
const BULK_IMG = 'https://ik.imagekit.io/jcp2urr7b/content/02_home_page/08_planning_for_crowd/planning_for_crowd_jpg_B-RGyIjuR.jpg'

const BULK_PERKS = [
  { icon: Building2,  label: 'Bulk & corporate' },
  { icon: FileText,   label: 'GST invoice' },
  { icon: Truck,      label: 'Pan-India' },
  { icon: BadgeCheck, label: 'Dedicated AM' },
]

const STEPS = [
  { n: 1, label: 'Upload Photo',    desc: 'Upload your room or venue photo',    icon: Camera,        accent: 'accent-peach' },
  { n: 2, label: 'Preview with AI', desc: 'See your decor before booking',      icon: Wand2,         accent: 'accent-pink' },
  { n: 3, label: 'Book Decorators', desc: 'Pick date, time and setup location', icon: CalendarCheck, accent: 'accent-lavender' },
  { n: 4, label: 'Celebrate',       desc: 'Our team sets it up, you enjoy',     icon: PartyPopper,   accent: 'accent-mint' },
]

const TRUST = [
  { icon: ShieldCheck, label: 'Secure Payment' },
  { icon: Star,        label: 'Top Decorators' },
  { icon: BadgeCheck,  label: 'Verified Service' },
]

const ik = (url, tr) => (url && url.includes('ik.imagekit.io') ? `${url}?tr=${tr}` : url)

export default function HomeScreen() {
  const {
    user, designs, orders, navigate, setSelectedDesign, setSelectedOrder,
    userAddress, locationLoading, locationDenied, detectLocation,
    setGiftMode, setGiftCart, gifts, loadGifts, uploadForm, setUploadForm, setPendingGiftId,
    festivals, setFestivals, setSelectedFestivalId,
  } = useApp()

  useEffect(() => { if (gifts.length === 0) loadGifts() }, [])

  useEffect(() => {
    if (festivals.length > 0) return
    let alive = true
    api('festivals').then((data) => {
      if (alive && Array.isArray(data)) setFestivals(data)
    })
    return () => { alive = false }
  }, [])

  const cityLabel = userAddress?.city || userAddress?.area || 'your city'

  const featuredGifts = gifts
    .filter(g => (g.active !== false && g.is_active !== false) && (g.stock === undefined || g.stock > 0))
  const giftImg = (g) => ik(g.images?.[0] || g.image_url || '', 'w-280,h-280,q-80,c-maintain_ratio')

  const thumbs = featuredGifts.slice(0, 4)
  const recentDesigns = designs.slice(0, 5)
  const activeOrder = orders.find(o => !['delivered', 'cancelled'].includes(o.delivery_status) && o.payment_status !== 'pending')

  const categories = ['All', ...[...new Set(gifts.map(g => g.category).filter(Boolean))].slice(0, 7)]
  const [activeCat, setActiveCat] = useState('All')
  const [trending, setTrending] = useState(TRENDING)   // admin-editable; TRENDING is the fallback

  useEffect(() => {
    let alive = true
    api('trending').then((data) => {
      if (alive && Array.isArray(data) && data.length) setTrending(data)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const startOccasion = (occ) => { setUploadForm(p => ({ ...p, occasion: occ })); navigate(SCREENS.UPLOAD) }
  const openGifts = () => { setGiftMode('standalone'); navigate(SCREENS.GIFTS) }
  const openGift = (id) => { setGiftMode('standalone'); setPendingGiftId(id); navigate(SCREENS.GIFTS) }
  const openFestival = (id) => { setSelectedFestivalId(id); navigate(SCREENS.FESTIVAL) }

  const festMin = (f) => {
    const prices = (f.hampers || []).map(h => h.price).filter(p => typeof p === 'number')
    return prices.length ? Math.min(...prices) : null
  }

  // Trending hampers = the festivals flagged "Feature on home carousel" in admin
  // (fall back to all festivals if none are featured). Editing a festival in the
  // admin "Trending Hampers" section updates its Home card directly.
  const hamperSource = festivals.some(f => f.featured) ? festivals.filter(f => f.featured) : festivals
  const hamperCards = hamperSource.map(f => ({ id: f.id, festivalId: f.id, image: f.hero, eyebrow: f.eyebrow, title: f.name, tagline: f.tagline, priceFrom: festMin(f), color: f.color }))
  const openHamper = (c) => (c.festivalId ? openFestival(c.festivalId) : openGifts())

  const thumbPos = [
    { className: 'top-16 left-2 -rotate-6 w-[72px] h-[72px]' },
    { className: 'top-40 left-5 rotate-3 w-16 h-16' },
    { className: 'top-16 right-2 rotate-6 w-[84px] h-[84px]' },
    { className: 'top-44 right-3 -rotate-3 w-[68px] h-[68px]' },
  ]

  return (
    <div className="min-h-screen bg-aurora pb-28 fade-in">

      {/* ── TALL HEADER ── */}
      <div className="relative h-[480px] overflow-hidden">
        <div className="absolute -top-10 -right-20 w-72 h-72 iridescent-orb opacity-60 pointer-events-none" />
        <div className="absolute top-40 -left-12 w-56 h-56 iridescent-orb opacity-40 pointer-events-none" />

        {/* Floating decoration thumbnails (real gift images) */}
        <div className="absolute inset-0 pointer-events-none">
          {thumbs.map((g, i) => (
            <div key={g.id} className={`absolute ${thumbPos[i].className} rounded-3xl overflow-hidden glass-floating float-y`} style={{ animationDelay: `${i * 0.6}s`, opacity: 0.62 }}>
              {giftImg(g) ? <img src={giftImg(g)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-pink-50" />}
            </div>
          ))}
        </div>

        {/* Top bar */}
        <div className="relative px-6 pt-12 z-10">
          <div className="flex items-center justify-between mb-10">
            <button onClick={() => navigate(SCREENS.ADDRESS)} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full glass-overlay flex items-center justify-center">
                {locationLoading
                  ? <Loader2 className="w-4 h-4 text-gray-800 animate-spin" />
                  : <MapPin className={`w-4 h-4 ${locationDenied ? 'text-red-400' : 'text-gray-800'}`} strokeWidth={2.2} />}
              </div>
              <div className="text-left">
                <p className="text-gray-600 text-[10px] font-bold tracking-[0.2em] uppercase">Decor near</p>
                <div className="flex items-center gap-1">
                  <h1 className="text-gray-900 text-[15px] font-bold capitalize truncate max-w-[150px]">{cityLabel}</h1>
                  <ChevronDown className="w-3 h-3 text-gray-700" strokeWidth={2.4} />
                </div>
              </div>
            </button>
            <button onClick={() => navigate(SCREENS.ORDERS)} className="w-11 h-11 rounded-full glass-overlay flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-gray-800" strokeWidth={2.2} />
              {activeOrder && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-pink-500" />}
            </button>
          </div>

          {/* Editorial hero */}
          <div className="mb-8 mt-24">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-overlay mb-3">
              <Sparkles className="w-3 h-3 text-pink-600" strokeWidth={2.4} />
              <span className="text-[10px] font-bold text-gray-900 tracking-widest uppercase">India&apos;s First AI-Powered Decor</span>
            </div>
            <h2 className="font-display text-[40px] font-medium text-gray-900 leading-[0.98] tracking-tight">
              See Your Space<br />
              <span className="italic font-normal iridescent-text">Decorated</span><br />
              <span className="text-gray-900">Before You Book</span>
            </h2>
          </div>
        </div>
      </div>

      {/* ── AI Decorate floating CTA ── */}
      <div className="relative px-6 -mt-16 z-20">
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Upload your room photo, preview your decor with AI, and book Fatafat Decor for birthdays, anniversaries, surprises, festivals and more.
        </p>

        <button onClick={() => navigate(SCREENS.UPLOAD)}
          className="w-full glass-floating rounded-[28px] px-5 py-4 flex items-center gap-4 hover:-translate-y-0.5 transition-transform text-left">
          <div className="relative w-14 h-14 rounded-2xl iridescent aurora-shimmer flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
            <div className="absolute inset-0 rounded-2xl iridescent opacity-50 blur-md -z-10" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-pink-600">AI Powered · Free for new users</p>
            <h3 className="text-gray-900 font-bold text-[15px] mt-0.5">Try Instant Decor AI</h3>
            <p className="text-gray-500 text-[11px] mt-0.5">Upload your room photo, see the decor</p>
          </div>
          <div className="px-3.5 py-2.5 rounded-full bg-gray-900 flex items-center gap-1.5 flex-shrink-0">
            <span className="text-white text-[11px] font-bold tracking-wide">Try</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
          </div>
        </button>

        {/* Secondary — gifts entry */}
        <button onClick={openGifts}
          className="w-full mt-3 rounded-full bg-white border border-gray-100 px-5 py-3.5 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform"
          style={{ boxShadow: '0 6px 20px -10px rgba(60,30,90,0.15)' }}>
          <Gift className="w-4 h-4 text-pink-600" strokeWidth={2.2} />
          <span className="text-[13px] font-bold text-gray-900">Send gifts &amp; flowers</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-700" strokeWidth={2.4} />
        </button>

        <p className="text-center text-[10px] tracking-[0.3em] uppercase text-gray-500 mt-3">From your phone · to your room</p>
      </div>

      {/* ── Main content ── */}
      <div className="px-6 mt-8 space-y-8 relative z-10">

        {/* Decor Preview Credits card */}
        <button onClick={() => navigate(SCREENS.CREDITS)} className="w-full glass-floating rounded-[24px] p-4 flex items-center gap-3 text-left">
          <div className="w-12 h-12 rounded-2xl iridescent flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">AI Previews</p>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">Free for new users</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-1"><span className="iridescent-text">{user?.credits || 0}</span> credits left</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Each credit = 1 AI room preview</p>
          </div>
          <div className="px-3 py-2 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center gap-1 flex-shrink-0">
            <Plus className="w-3 h-3" strokeWidth={2.6} /> Buy
          </div>
        </button>

        {/* Occasion quick cards */}
        <section>
          <div className="mb-4">
            <p className="eyebrow text-gray-600">Pick a vibe</p>
            <h3 className="font-display text-2xl font-medium text-gray-900 mt-1">What are we <span className="italic font-normal iridescent-text">celebrating?</span></h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-6 px-6">
            {OCCASIONS.map((o) => (
              <button key={o.id} onClick={() => startOccasion(o.occasion)} className="flex-shrink-0 w-28 glass-floating rounded-[20px] p-3.5 text-center hover:-translate-y-1 transition-transform">
                <div className={`w-12 h-12 rounded-2xl ${o.accent} flex items-center justify-center mx-auto mb-2.5`}>
                  <o.icon className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <p className="text-[11px] font-bold text-gray-900 leading-tight">{o.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Trending Decorations */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="eyebrow text-gray-600">Near you</p>
              <h3 className="font-display text-3xl font-medium text-gray-900 mt-1">Trending <span className="italic font-normal iridescent-text">Decorations</span></h3>
            </div>
            <button onClick={() => navigate(SCREENS.UPLOAD)} className="text-xs font-bold text-gray-900 underline underline-offset-4">View All</button>
          </div>
          <div className="space-y-3">
            {trending.map((t) => (
              <button key={t.id} onClick={() => startOccasion(t.occasion)}
                className="w-full glass-floating rounded-[24px] p-3 flex items-center gap-3.5 text-left hover:-translate-y-0.5 transition-transform">
                <div className="relative w-24 h-24 rounded-[18px] overflow-hidden flex-shrink-0">
                  <img src={ik(t.image, 'w-192,h-192,q-80,c-maintain_ratio')} alt={t.title} className="w-full h-full object-cover" />
                  <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ${t.accent} border border-white/70`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-pink-600 text-[10px] font-bold tracking-wide uppercase">{t.category}</p>
                  <h4 className="text-gray-900 font-bold text-[14px] leading-tight mt-0.5">{t.title}</h4>
                  <p className="text-gray-500 text-[11px] mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" strokeWidth={2.2} /> {t.location || 'Ranchi, Jharkhand'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-1.5">
                      <span className="w-5 h-5 rounded-full accent-peach border-2 border-white" />
                      <span className="w-5 h-5 rounded-full accent-pink border-2 border-white" />
                      <span className="w-5 h-5 rounded-full accent-lavender border-2 border-white" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600">{t.booked} booked recently</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2.2} />
              </button>
            ))}
          </div>
        </section>

        {/* Trending hampers */}
        {hamperCards.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="eyebrow text-gray-600">Limited season</p>
                <h3 className="font-display text-3xl font-medium text-gray-900 mt-1">Trending <span className="italic font-normal iridescent-text">hampers</span></h3>
              </div>
              <button onClick={() => navigate(SCREENS.TRENDING_HAMPERS)} className="text-xs font-bold text-gray-900 underline underline-offset-4">View All</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              {hamperCards.map((c) => (
                <button key={c.id} onClick={() => openHamper(c)}
                  className="flex-shrink-0 w-64 glass-floating rounded-[24px] overflow-hidden text-left hover:-translate-y-1 transition-transform">
                  <div className="relative aspect-[5/4] bg-pink-50/50">
                    {c.image
                      ? <img src={ik(c.image, 'w-512,q-80')} alt={c.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Gift className="w-8 h-8 text-pink-300" /></div>}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)' }} />
                    <div className="absolute bottom-3 left-4 right-4">
                      {c.eyebrow && <p className="text-white/80 text-[9px] font-bold tracking-[0.25em] uppercase">{c.eyebrow}</p>}
                      <h4 className="font-display text-white text-xl font-medium leading-tight mt-0.5">{c.title}</h4>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      {c.tagline && <p className="text-gray-500 text-[9px] font-bold tracking-[0.2em] uppercase truncate">{c.tagline}</p>}
                      {c.priceFrom != null && c.priceFrom > 0 && (
                        <p className="text-gray-900 text-[13px] font-bold mt-1 flex items-center">
                          Hampers starting from&nbsp;<IndianRupee className="w-3 h-3" />{Number(c.priceFrom).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                    <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: c.color || '#111827' }}>
                      <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.4} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Add gifts to your celebration */}
        <section>
          <div className="mb-4">
            <p className="eyebrow text-gray-600">Add-ons</p>
            <h3 className="font-display text-3xl font-medium text-gray-900 mt-1 leading-tight">Add gifts to your <span className="italic font-normal iridescent-text">celebration</span></h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ADD_GIFTS.map((c) => (
              <button key={c.id} onClick={openGifts}
                className="glass-floating rounded-[20px] overflow-hidden text-left hover:-translate-y-1 transition-transform">
                <div className="relative aspect-[5/4]">
                  <img src={ik(c.image, 'w-360,q-80')} alt={c.name} className="w-full h-full object-cover" />
                  <span className={`absolute top-2.5 left-2.5 w-8 h-8 rounded-full ${c.accent} flex items-center justify-center`}>
                    <Gift className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                  </span>
                </div>
                <div className="p-3">
                  <h4 className="text-gray-900 font-bold text-[13px] leading-tight">{c.name}</h4>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <p className="text-gray-500 text-[10px] leading-tight truncate">{c.desc}</p>
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={2.4} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Top Picks — real gifts */}
        {featuredGifts.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-5">
              <div className="flex items-end gap-2">
                <div>
                  <p className="eyebrow text-gray-600">Curated</p>
                  <h3 className="font-display text-3xl font-medium text-gray-900 mt-1">Top Picks</h3>
                </div>
                <Flame className="w-5 h-5 text-orange-500 mb-2" />
              </div>
              <button onClick={openGifts} className="text-xs font-bold text-gray-900 underline underline-offset-4">View All</button>
            </div>

            {categories.length > 1 && (
              <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCat(cat)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${activeCat === cat ? 'bg-gray-900 text-white shadow-sm' : 'glass-card text-gray-700'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              {featuredGifts.filter(g => activeCat === 'All' || g.category === activeCat).slice(0, 10).map((g) => (
                <button key={g.id} onClick={() => openGift(g.id)}
                  className="flex-shrink-0 w-44 glass-floating rounded-[24px] overflow-hidden text-left hover:-translate-y-1 transition-transform">
                  <div className="aspect-square relative bg-pink-50/50">
                    {giftImg(g) ? <img src={giftImg(g)} alt={g.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Gift className="w-8 h-8 text-pink-300" /></div>}
                    <span className="absolute top-3 right-3 w-9 h-9 rounded-full glass-overlay flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 text-pink-600" strokeWidth={2.2} />
                    </span>
                  </div>
                  <div className="p-3.5">
                    {g.occasion && <p className="text-pink-600 text-[10px] font-bold tracking-wide uppercase mb-1">{g.occasion}</p>}
                    <h4 className="text-gray-900 font-bold text-[13px] leading-tight mb-2 line-clamp-2 min-h-[32px]">{g.name}</h4>
                    <p className="text-gray-900 text-base font-bold flex items-center"><IndianRupee className="w-3.5 h-3.5" />{g.price?.toLocaleString('en-IN')}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* For two — Featured */}
        <section>
          <div className="mb-4">
            <p className="eyebrow text-gray-600">Featured</p>
            <h3 className="font-display text-3xl font-medium text-gray-900 mt-1">For two</h3>
          </div>
          <button onClick={() => startOccasion('anniversary')}
            className="w-full glass-floating rounded-[28px] overflow-hidden text-left hover:-translate-y-0.5 transition-transform">
            <div className="relative aspect-[16/11]">
              <img src={ik(FOR_TWO_IMG, 'w-800,q-80')} alt="Romantic Anniversary Setup" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)' }} />
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full glass-overlay text-[9px] font-black tracking-widest uppercase text-gray-900">Most loved</span>
              <div className="absolute bottom-4 left-5 right-5">
                <h4 className="font-display text-white text-2xl font-medium leading-tight">Romantic Anniversary Setup</h4>
                <p className="text-white/80 text-[11px] mt-1">Setup + dismantling included</p>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Starting from</p>
                <p className="text-gray-900 text-lg font-bold flex items-center mt-0.5"><IndianRupee className="w-4 h-4" />3,299</p>
              </div>
              <span className="px-4 py-2.5 rounded-full bg-gray-900 flex items-center gap-1.5 flex-shrink-0">
                <span className="text-white text-[11px] font-bold">Customise</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
              </span>
            </div>
          </button>
        </section>

        {/* Planning for a crowd — Bulk band */}
        <section>
          <div className="mb-4">
            <p className="eyebrow text-gray-600">For 20+ guests</p>
            <h3 className="font-display text-3xl font-medium text-gray-900 mt-1">Planning for <span className="italic font-normal iridescent-text">a crowd?</span></h3>
          </div>
          <button onClick={() => navigate(SCREENS.BULK)}
            className="w-full glass-floating rounded-[28px] overflow-hidden text-left hover:-translate-y-0.5 transition-transform">
            <div className="relative aspect-[16/10]">
              <img src={ik(BULK_IMG, 'w-800,q-80')} alt="Bulk gifting" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.62) 100%)' }} />
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full glass-overlay text-[9px] font-black tracking-widest uppercase text-gray-900">From 10 to 10,000</span>
              <div className="absolute bottom-4 left-5 right-5">
                <p className="text-white/80 text-[9px] font-bold tracking-[0.25em] uppercase">AI-curated bulk</p>
                <h4 className="font-display text-white text-2xl font-medium leading-tight mt-0.5">Create bulk gift plan</h4>
                <p className="text-white/80 text-[11px] mt-1">Return gifts · baby shower boxes · corporate hampers</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-2">
                {BULK_PERKS.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <p.icon className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" strokeWidth={2.2} />
                    <span className="text-[10px] font-bold text-gray-700">{p.label}</span>
                  </div>
                ))}
              </div>
              <span className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.4} />
              </span>
            </div>
          </button>
        </section>

        {/* Private selection teaser */}
        <button onClick={() => navigate(SCREENS.PRIVATE)}
          className="w-full rounded-[28px] p-6 relative overflow-hidden text-left hover:-translate-y-0.5 transition-transform"
          style={{ background: 'linear-gradient(135deg, #1a1126 0%, #2c1a3a 55%, #3d2150 100%)' }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,197,137,0.22), transparent 70%)', filter: 'blur(6px)' }} />
          <div className="absolute -bottom-12 -left-8 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(196,132,252,0.18), transparent 70%)', filter: 'blur(8px)' }} />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E5C589, #C9A45B)' }}>
              <Lock className="w-5 h-5" strokeWidth={2.2} style={{ color: '#1a1126' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase" style={{ color: '#E5C589', letterSpacing: '0.32em' }}>
                <Sparkles className="w-3 h-3" strokeWidth={2.4} /> Members only
              </p>
              <h4 className="font-display text-white text-xl font-medium leading-tight mt-1">
                Private premium <span className="italic font-normal" style={{ color: '#E5C589' }}>gift selection</span>
              </h4>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Exclusive hampers · custom selections</p>
            </div>
            <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.4} />
            </span>
          </div>
        </button>

        {/* Recent AI Designs */}
        {recentDesigns.length > 0 ? (
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="eyebrow text-gray-600">Your studio</p>
                <h3 className="font-display text-3xl font-medium text-gray-900 mt-1">Recent <span className="italic font-normal iridescent-text">designs</span></h3>
              </div>
              <button onClick={() => navigate(SCREENS.ORDERS)} className="text-xs font-bold text-gray-900 underline underline-offset-4">View All</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              {recentDesigns.map((d) => (
                <button key={d.id} onClick={() => { setSelectedDesign(d); navigate(SCREENS.DESIGN) }}
                  className="flex-shrink-0 w-44 glass-floating rounded-[24px] overflow-hidden text-left hover:-translate-y-1 transition-transform">
                  <div className="aspect-square relative bg-pink-50/50">
                    {d.decorated_image ? <img src={ik(d.decorated_image, 'w-352,h-352,q-75,c-maintain_ratio')} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Sparkles className="w-8 h-8 text-pink-300" /></div>}
                    <span className={`absolute top-3 left-3 text-[9px] font-black px-2 py-0.5 rounded-full ${d.status === 'ordered' ? 'bg-green-100 text-green-700' : 'bg-white/90 text-pink-600'}`}>{d.status === 'ordered' ? 'ORDERED' : 'READY'}</span>
                  </div>
                  <div className="p-3.5">
                    <p className="text-pink-600 text-[10px] font-bold tracking-wide uppercase mb-1 capitalize">{d.occasion?.replace(/_/g, ' ')}</p>
                    <h4 className="text-gray-900 font-bold text-[13px] leading-tight mb-2 capitalize">{d.room_type}</h4>
                    <p className="text-gray-900 text-base font-bold flex items-center"><IndianRupee className="w-3.5 h-3.5" />{d.total_cost?.toLocaleString('en-IN')}</p>
                  </div>
                </button>
              ))}
              <button onClick={() => navigate(SCREENS.UPLOAD)} className="flex-shrink-0 w-32 rounded-[24px] glass-card border-2 border-dashed border-pink-200 flex flex-col items-center justify-center gap-2 hover:border-pink-400 transition-colors">
                <Sparkles className="w-7 h-7 text-pink-400" />
                <span className="text-xs font-bold text-pink-500">New Design</span>
              </button>
            </div>
          </section>
        ) : (
          <section>
            <div className="glass-floating rounded-[28px] p-6 text-center">
              <div className="w-14 h-14 iridescent aurora-shimmer rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/60">
                <Wand2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-display text-2xl text-gray-900 mb-1">No designs yet</h3>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">Upload a room photo and let AI create a stunning decoration plan for you</p>
              <button onClick={() => navigate(SCREENS.UPLOAD)} className="btn-primary-luxury text-white font-bold text-sm px-6 py-3 rounded-2xl">Create your first design</button>
            </div>
          </section>
        )}

        {/* Active order strip */}
        {activeOrder && (
          <button onClick={() => { setSelectedOrder(activeOrder); navigate(SCREENS.TRACKING) }}
            className="w-full glass-floating rounded-[24px] p-4 flex items-center gap-3 text-left hover:-translate-y-0.5 transition-transform">
            <div className="w-12 h-12 rounded-2xl iridescent flex items-center justify-center flex-shrink-0 premium-pulse">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-pink-600">Live order</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">Order #{activeOrder.id.slice(0, 8)}</p>
              <p className="text-[11px] text-gray-500 capitalize">{activeOrder.delivery_status?.replace(/_/g, ' ')} · tap to track</p>
            </div>
            <div className="px-3.5 py-2.5 rounded-full bg-gray-900 flex items-center gap-1.5 flex-shrink-0">
              <span className="text-white text-[11px] font-bold">Track</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
            </div>
          </button>
        )}

        {/* How it works */}
        <section>
          <div className="mb-5">
            <p className="eyebrow text-gray-600">Effortless flow</p>
            <h3 className="font-display text-3xl font-medium text-gray-900 leading-tight mt-1">How it <span className="italic font-normal iridescent-text">works</span></h3>
          </div>
          <div className="glass-floating rounded-[28px] p-5">
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-2xl ${s.accent} flex items-center justify-center`}>
                      <s.icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                    </div>
                    {i < STEPS.length - 1 && <div className="absolute left-1/2 top-12 w-px h-4" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18), transparent)', transform: 'translateX(-0.5px)' }} />}
                  </div>
                  <div className="flex-1 pt-1">
                    <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Step {s.n}</span>
                    <h4 className="text-sm font-bold text-gray-900 mt-0.5">{s.label}</h4>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About / trust */}
        <section className="glass-floating rounded-[28px] p-6">
          <p className="eyebrow text-gray-600 mb-2">About</p>
          <h3 className="font-display text-2xl font-medium text-gray-900 mb-3">Decor Crafted for Every Celebration</h3>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            Planning decor should be simple. Fatafat Decor helps you preview, choose and book beautiful balloon decor, gifting and event setups in Ranchi.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/40">
            {TRUST.map((t, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                <t.icon className="w-4 h-4 text-pink-500" />
                <span className="text-[10px] font-bold text-gray-600">{t.label}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
