'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft, Check, MapPin, Calendar as CalendarIcon, Sparkles, Building2,
  Boxes, ArrowRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, api } from '../lib/constants'

export default function BulkScreen() {
  const { navigate, goBack, showToast, user } = useApp()

  const [config, setConfig] = useState({ occasions: [], themes: [], tiers: [], hampers: [] })
  const [configLoading, setConfigLoading] = useState(true)
  const [occasionId, setOccasionId] = useState('birthday-return')
  const [qty, setQty] = useState('')
  const [budgetPerUnit, setBudgetPerUnit] = useState('')
  const [theme, setTheme] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [customization, setCustomization] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api('bulk/config').then(d => {
      if (!d?.error && Array.isArray(d?.occasions)) {
        setConfig(d)
        if (d.occasions.length > 0 && !d.occasions.some(o => o.id === 'birthday-return')) {
          setOccasionId(d.occasions[0].id)
        }
      }
    }).finally(() => setConfigLoading(false))
  }, [])

  const selectedOccasion = useMemo(
    () => config.occasions.find(o => o.id === occasionId) || null,
    [config.occasions, occasionId]
  )

  const canSubmit = qty.trim() !== '' && city.trim() !== '' && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const data = await api('leads', {
        method: 'POST',
        body: {
          type: 'bulk',
          occasionId,
          occasionName: selectedOccasion?.name || '',
          qty: Number(qty) || 0,
          budgetPerUnit: budgetPerUnit ? Number(budgetPerUnit) : '',
          theme,
          city: city.trim(),
          date,
          customization,
          contactName: user?.name || '',
          contactPhone: user?.phone || '',
        },
      })
      if (data?.error) { showToast(data.error, 'error'); return }
      showToast('Bulk gift plan requested — our team will WhatsApp you within 4 hours.', 'success')
      goBack()
    } catch {
      showToast('Could not send your plan. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-aurora pb-44 fade-in">

      {/* ── Header ── */}
      <div className="glass-overlay px-4 pt-12 pb-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-xl glass-card flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 text-center">
            <p className="eyebrow text-gray-400">Bulk plan</p>
            <h1 className="font-display text-2xl text-gray-900 leading-tight">Bulk Orders</h1>
          </div>
          <button onClick={() => navigate(SCREENS.CORPORATE)}
            className="px-3 py-2 rounded-full bg-gray-900 text-white text-[10px] font-bold tracking-widest active:scale-95 transition-transform">
            CORPORATE
          </button>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-8">

        {/* ── Hero ── */}
        <div>
          <p className="eyebrow text-gray-600">From 20 to 10,000 gifts</p>
          <h2 className="font-display text-[34px] font-medium text-gray-900 leading-[1.05] mt-1">
            Bulk gifts for<br /><span className="italic font-normal iridescent-text">20+ guests</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mt-3">
            Plan curated bulk hampers, return gifts and corporate boxes — branded, GST-ready and pan-India delivered.
          </p>
        </div>

        {/* ── Occasion cards ── */}
        <section>
          <p className="eyebrow text-gray-600 mb-3">What&apos;s it for?</p>
          {configLoading ? (
            <div className="grid grid-cols-2 gap-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-pink-50/60 rounded-[20px]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {config.occasions.map(o => {
                const active = o.id === occasionId
                return (
                  <button key={o.id} onClick={() => setOccasionId(o.id)}
                    className={`relative glass-floating rounded-[20px] overflow-hidden text-left transition-all active:scale-[0.98] ${active ? 'ring-2 ring-pink-500' : ''}`}>
                    <div className="relative h-24 bg-pink-50/50">
                      {o.image && <img src={o.image} alt={o.name} className="w-full h-full object-cover" loading="lazy" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                      {active && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[12px] font-bold text-gray-900 leading-tight">{o.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{o.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Tier savings strip ── */}
        {config.tiers.length > 0 && (
          <section>
            <p className="eyebrow text-gray-600 mb-3">Volume pricing</p>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
              {config.tiers.map(t => (
                <div key={t.id || t.qty} className="shrink-0 w-28 glass-floating rounded-[18px] p-3 text-center">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-500">{t.label}</p>
                  <p className="text-[13px] font-bold text-gray-900 mt-1">{t.qty} pcs</p>
                  <p className="text-sm font-bold text-pink-600 mt-0.5">₹{t.perUnit?.toLocaleString('en-IN')}<span className="text-[9px] text-gray-400 font-semibold">/unit</span></p>
                  {t.save > 0 ? (
                    <span className="inline-block mt-1.5 text-[9px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full">SAVE {t.save}%</span>
                  ) : (
                    <span className="inline-block mt-1.5 text-[9px] font-bold text-gray-400 bg-white/70 px-2 py-0.5 rounded-full">BASE</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Form ── */}
        <section className="glass-floating rounded-[28px] p-5 space-y-4">
          <p className="eyebrow text-gray-600">Tell us your plan</p>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Occasion</label>
            <input value={selectedOccasion?.name || ''} readOnly
              className="w-full px-3.5 py-3 bg-white/50 border border-white/80 rounded-2xl text-sm text-gray-700 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Quantity</label>
              <input value={qty} onChange={e => setQty(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" placeholder="50"
                className="w-full px-3.5 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-pink-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Budget per unit</label>
              <input value={budgetPerUnit} onChange={e => setBudgetPerUnit(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" placeholder="₹ 499"
                className="w-full px-3.5 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-pink-300" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Theme</label>
            <div className="flex flex-wrap gap-1.5">
              {(config.themes.length > 0 ? config.themes : [
                { id: 'pastel', name: 'Pastel' }, { id: 'royal', name: 'Royal' }, { id: 'minimal', name: 'Minimal' },
                { id: 'festive', name: 'Festive' }, { id: 'corporate', name: 'Corporate' }, { id: 'kids', name: 'Kids' },
              ]).map(t => (
                <button key={t.id} onClick={() => setTheme(theme === t.id ? '' : t.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${theme === t.id ? 'btn-primary-luxury text-white' : 'bg-white/60 text-gray-600 border border-white/80'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Delivery city</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ranchi"
                  className="w-full pl-9 pr-3 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-pink-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Delivery date</label>
              <div className="relative">
                <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-9 pr-2 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm text-gray-800 outline-none focus:border-pink-300" />
              </div>
            </div>
          </div>

          {/* Customization toggle */}
          <button onClick={() => setCustomization(!customization)}
            className="w-full glass-card rounded-2xl p-3.5 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl iridescent flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-900">Customization needed?</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{customization ? "We'll plan a custom design" : 'Branded boxes, monograms etc.'}</p>
            </div>
            <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${customization ? 'bg-pink-500' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${customization ? 'translate-x-5' : ''}`} />
            </div>
          </button>
        </section>

        {/* ── Corporate shortcut ── */}
        <button onClick={() => navigate(SCREENS.CORPORATE)}
          className="w-full glass-floating rounded-[24px] p-4 flex items-center gap-3 text-left hover:-translate-y-0.5 transition-transform">
          <div className="w-12 h-12 rounded-2xl accent-lavender flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Looking for office gifting?</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Go to Corporate Desk</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-700 shrink-0" strokeWidth={2.4} />
        </button>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-[80px] left-0 right-0 max-w-md mx-auto px-4 z-40">
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full btn-primary-luxury text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50">
          <Boxes className="w-4 h-4" strokeWidth={2.2} />
          {submitting ? 'Sending...' : 'Create Bulk Gift Plan'}
        </button>
      </div>
    </div>
  )
}
