'use client'

// "View All" for the Home Trending hampers row — a full grid of every
// admin-curated hamper card. Falls back to festivals if the collection is empty.
import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, Gift, IndianRupee, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, api } from '../lib/constants'

const ik = (url, tr) => (url && url.includes('ik.imagekit.io') ? `${url}?tr=${tr}` : url)

export default function TrendingHampersScreen() {
  const { goBack, navigate, festivals, setFestivals, setGiftMode, setSelectedFestivalId } = useApp()
  const [loading, setLoading] = useState(festivals.length === 0)

  const festMin = (f) => {
    const prices = (f.hampers || []).map(h => h.price).filter(p => typeof p === 'number')
    return prices.length ? Math.min(...prices) : null
  }

  useEffect(() => {
    if (festivals.length > 0) { setLoading(false); return }
    let alive = true
    api('festivals')
      .then(d => { if (alive && Array.isArray(d)) setFestivals(d) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  // Every festival, shown as a hamper card (View All = all of them).
  const list = useMemo(() => (
    festivals.map(f => ({ id: f.id, festivalId: f.id, image: f.hero, eyebrow: f.eyebrow, title: f.name, tagline: f.tagline, priceFrom: festMin(f), color: f.color }))
  ), [festivals])

  const openCard = (c) => {
    if (c.festivalId) { setSelectedFestivalId(c.festivalId); navigate(SCREENS.FESTIVAL) }
    else { setGiftMode('standalone'); navigate(SCREENS.GIFTS) }
  }

  return (
    <div className="min-h-screen bg-aurora pb-28 fade-in">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-overlay px-4 pt-5 pb-4 flex items-center gap-3">
        <button onClick={goBack} className="w-9 h-9 rounded-full glass-card flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <p className="eyebrow text-gray-500">Limited season</p>
          <h1 className="font-display text-2xl text-gray-900 leading-tight">Trending <span className="italic iridescent-text">hampers</span></h1>
        </div>
      </div>

      <div className="px-4 pt-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-64 rounded-[24px] bg-pink-50/60 animate-pulse" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20">
            <Gift className="w-12 h-12 text-pink-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hampers live right now — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {list.map(c => (
              <button key={c.id} onClick={() => openCard(c)}
                className="glass-floating rounded-[24px] overflow-hidden text-left hover:-translate-y-1 transition-transform">
                <div className="relative aspect-[5/4] bg-pink-50/50">
                  {c.image
                    ? <img src={ik(c.image, 'w-512,q-80')} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center"><Gift className="w-8 h-8 text-pink-300" /></div>}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.6) 100%)' }} />
                  <div className="absolute bottom-3 left-4 right-4">
                    {c.eyebrow && <p className="text-white/80 text-[9px] font-bold tracking-[0.25em] uppercase truncate">{c.eyebrow}</p>}
                    <h4 className="font-display text-white text-xl font-medium leading-tight mt-0.5">{c.title}</h4>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {c.tagline && <p className="text-gray-500 text-[9px] font-bold tracking-[0.2em] uppercase truncate">{c.tagline}</p>}
                    {c.priceFrom != null && c.priceFrom > 0 && (
                      <p className="text-gray-900 text-[13px] font-bold mt-1 flex items-center">
                        From&nbsp;<IndianRupee className="w-3 h-3" />{Number(c.priceFrom).toLocaleString('en-IN')}
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
        )}
      </div>
    </div>
  )
}
