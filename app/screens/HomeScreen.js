'use client'

import { useEffect, useState } from 'react'
import {
  Bell, MapPin, Heart, Sparkles, ArrowRight, Users, ChevronDown, Wand2, Plus,
  Cake, Baby, PartyPopper, Home as HomeIcon, Briefcase, Flame, Package, Gift,
  Camera, CalendarCheck, Zap, IndianRupee, Loader2, ShieldCheck, Star, BadgeCheck,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, LOGO_URL } from '../lib/constants'

const OCCASIONS = [
  { id: 'birthday',     name: 'Birthday',       icon: Cake,        accent: 'accent-peach',    occasion: 'birthday' },
  { id: 'anniversary',  name: 'Anniversary',    icon: Heart,       accent: 'accent-pink',     occasion: 'anniversary' },
  { id: 'baby-shower',  name: 'Baby Shower',    icon: Baby,        accent: 'accent-lavender', occasion: 'baby_shower' },
  { id: 'surprise',     name: 'Surprise Room',  icon: PartyPopper, accent: 'accent-pink',     occasion: 'party' },
  { id: 'housewarming', name: 'Housewarming',   icon: HomeIcon,    accent: 'accent-mint',     occasion: 'housewarming' },
  { id: 'corporate',    name: 'Corporate',      icon: Briefcase,   accent: 'accent-lavender', occasion: 'corporate' },
  { id: 'festival',     name: 'Festival Decor', icon: Flame,       accent: 'accent-peach',    occasion: 'festival' },
  { id: 'romantic',     name: 'Romantic Setup', icon: Sparkles,    accent: 'accent-pink',     occasion: 'anniversary' },
]

const STEPS = [
  { n: 1, label: 'Upload Photo',    desc: 'Snap your space — any room works',         icon: Camera,        accent: 'accent-peach' },
  { n: 2, label: 'Preview with AI', desc: 'See your celebration before it happens',   icon: Wand2,         accent: 'accent-pink' },
  { n: 3, label: 'Book Decorators', desc: 'Pick a date, time and venue',              icon: CalendarCheck, accent: 'accent-lavender' },
  { n: 4, label: 'Celebrate',       desc: 'Crew arrives, you only enjoy',             icon: PartyPopper,   accent: 'accent-mint' },
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
  } = useApp()

  useEffect(() => { if (gifts.length === 0) loadGifts() }, [])

  const cityLabel = userAddress?.city || userAddress?.area || 'your city'

  const featuredGifts = gifts
    .filter(g => (g.active !== false && g.is_active !== false) && (g.stock === undefined || g.stock > 0))
  const giftImg = (g) => ik(g.images?.[0] || g.image_url || '', 'w-280,h-280,q-80,c-maintain_ratio')

  const thumbs = featuredGifts.slice(0, 4)
  const recentDesigns = designs.slice(0, 5)
  const activeOrder = orders.find(o => !['delivered', 'cancelled'].includes(o.delivery_status) && o.payment_status !== 'pending')

  const categories = ['All', ...[...new Set(gifts.map(g => g.category).filter(Boolean))].slice(0, 7)]
  const [activeCat, setActiveCat] = useState('All')

  const startOccasion = (occ) => { setUploadForm(p => ({ ...p, occasion: occ })); navigate(SCREENS.UPLOAD) }
  const openGifts = () => { setGiftMode('standalone'); navigate(SCREENS.GIFTS) }
  const openGift = (id) => { setGiftMode('standalone'); setPendingGiftId(id); navigate(SCREENS.GIFTS) }

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
              See your space<br />
              <span className="italic font-normal iridescent-text">decorated</span><br />
              <span className="text-gray-900">before you book</span>
            </h2>
          </div>
        </div>
      </div>

      {/* ── AI Decorate floating CTA ── */}
      <div className="relative px-6 -mt-16 z-20">
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          Click a photo of your room, see your decoration with Instant Decor AI, and book Fatafat Decor to set it up at your place — for birthdays, surprises and more.
        </p>

        <button onClick={() => navigate(SCREENS.UPLOAD)}
          className="w-full glass-floating rounded-[28px] px-5 py-4 flex items-center gap-4 hover:-translate-y-0.5 transition-transform text-left">
          <div className="relative w-14 h-14 rounded-2xl iridescent aurora-shimmer flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
            <div className="absolute inset-0 rounded-2xl iridescent opacity-50 blur-md -z-10" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-pink-600">AI Powered · {user?.credits || 0} credits</p>
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

        {/* AI Credits card */}
        <button onClick={() => navigate(SCREENS.CREDITS)} className="w-full glass-floating rounded-[24px] p-4 flex items-center gap-3 text-left">
          <div className="w-12 h-12 rounded-2xl iridescent flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">AI Previews</p>
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
          <h3 className="font-display text-2xl font-medium text-gray-900 mb-3">Crafted to celebrate</h3>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">
            Planning a moment can be a daunting task — especially when every detail matters. With our curated decor and AI-assisted ideation, every celebration becomes effortless.
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
