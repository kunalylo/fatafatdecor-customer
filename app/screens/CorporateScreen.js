'use client'

import { useState, useEffect } from 'react'
import {
  ChevronLeft, Check, MapPin, Calendar as CalendarIcon, Building2, Phone,
  FileText, Truck, BadgeCheck, Palette, Sparkles,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'

const TRUST = [
  { icon: FileText,   label: 'GST' },
  { icon: Truck,      label: 'Pan-India' },
  { icon: BadgeCheck, label: 'AM' },
  { icon: Palette,    label: 'Co-brand' },
]

export default function CorporateScreen() {
  const { goBack, showToast, user } = useApp()

  const [packages, setPackages] = useState([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [packageId, setPackageId] = useState('premium')
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [qty, setQty] = useState('')
  const [budgetPerBox, setBudgetPerBox] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [officeDecor, setOfficeDecor] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [callbackSent, setCallbackSent] = useState(false)

  useEffect(() => {
    api('corporate/config').then(d => {
      if (!d?.error && Array.isArray(d?.packages)) {
        setPackages(d.packages)
        if (d.packages.length > 0 && !d.packages.some(p => p.id === 'premium')) {
          setPackageId(d.packages[0].id)
        }
      }
    }).finally(() => setPackagesLoading(false))
  }, [])

  const canSubmit = company.trim() !== '' && contact.trim() !== '' && qty.trim() !== '' && city.trim() !== '' && !submitting

  const postLead = (extra = {}) => api('leads', {
    method: 'POST',
    body: {
      type: 'corporate',
      packageId,
      company: company.trim(),
      contactName: contact.trim() || user?.name || '',
      contactPhone: user?.phone || '',
      qty: Number(qty) || 0,
      budgetPerBox: budgetPerBox ? Number(budgetPerBox) : '',
      city: city.trim(),
      date,
      officeDecor,
      ...extra,
    },
  })

  const handleCallback = async () => {
    if (callbackSent || submitting) return
    setSubmitting(true)
    try {
      const data = await postLead({ notes: 'Callback requested' })
      if (data?.error) { showToast(data.error, 'error'); return }
      setCallbackSent(true)
      showToast('Callback requested — our AM will call within 1 hour.', 'success')
    } catch {
      showToast('Could not request a callback. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const data = await postLead()
      if (data?.error) { showToast(data.error, 'error'); return }
      showToast('Corporate quote requested — our AM will WhatsApp you within 1 hour.', 'success')
      goBack()
    } catch {
      showToast('Could not send your request. Please try again.', 'error')
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
          <div className="flex-1">
            <p className="eyebrow text-gray-400">B2B</p>
            <h1 className="font-display text-2xl text-gray-900 leading-tight">Corporate Desk</h1>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-8">

        {/* ── Hero ── */}
        <div>
          <p className="eyebrow text-gray-600">For teams &amp; offices</p>
          <h2 className="font-display text-[34px] font-medium text-gray-900 leading-[1.05] mt-1">
            Corporate hampers &amp;<br /><span className="italic font-normal iridescent-text">office gifting</span>
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mt-3">
            Branded boxes, GST invoice, dedicated account manager.
          </p>
        </div>

        {/* ── Trust band ── */}
        <div className="glass-floating rounded-[22px] px-4 py-4 grid grid-cols-4 gap-2">
          {TRUST.map((t, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 text-center">
              <t.icon className="w-4 h-4 text-pink-500" strokeWidth={2.2} />
              <span className="text-[10px] font-bold text-gray-600">{t.label}</span>
            </div>
          ))}
        </div>

        {/* ── Packages ── */}
        <section>
          <p className="eyebrow text-gray-600 mb-3">Pick a starting package</p>
          {packagesLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-pink-50/60 rounded-[20px]" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map(p => {
                const active = p.id === packageId
                return (
                  <button key={p.id} onClick={() => setPackageId(p.id)}
                    className={`w-full glass-floating rounded-[20px] p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] ${active ? 'ring-2 ring-pink-500' : ''}`}>
                    <div className={`w-11 h-11 rounded-2xl ${p.accent || 'accent-mint'} flex items-center justify-center shrink-0`}>
                      <Building2 className="w-5 h-5 text-white" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-bold text-gray-900 leading-tight">{p.name}</p>
                        {p.popular && <span className="text-[8px] font-black tracking-widest bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">POPULAR</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-[12px] font-bold text-gray-900">{p.range}</p>
                      {active && (
                        <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Form ── */}
        <section className="glass-floating rounded-[28px] p-5 space-y-4">
          <p className="eyebrow text-gray-600">Tell us about your team</p>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Company name</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Ltd."
              className="w-full px-3.5 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-pink-300" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Contact person</label>
            <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Priya Sharma · +91 98765 43210"
              className="w-full px-3.5 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-pink-300" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Quantity</label>
              <input value={qty} onChange={e => setQty(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" placeholder="50"
                className="w-full px-3.5 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-pink-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">Budget per box</label>
              <input value={budgetPerBox} onChange={e => setBudgetPerBox(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" placeholder="₹ 1,500"
                className="w-full px-3.5 py-3 bg-white/70 border border-white/80 rounded-2xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-pink-300" />
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

          {/* Office decoration toggle */}
          <button onClick={() => setOfficeDecor(!officeDecor)}
            className="w-full glass-card rounded-2xl p-3.5 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl iridescent flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-gray-900">Need office decoration too?</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Add Fatafat Decor at no extra strain</p>
            </div>
            <div className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${officeDecor ? 'bg-pink-500' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${officeDecor ? 'translate-x-5' : ''}`} />
            </div>
          </button>
        </section>

        {/* ── Callback row ── */}
        <div className="glass-floating rounded-[24px] p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl accent-mint flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">Request a callback</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Dedicated AM · 1-hour response</p>
          </div>
          <button onClick={handleCallback} disabled={callbackSent || submitting}
            className="px-3.5 py-2 rounded-full bg-pink-500 text-white text-[10px] font-black tracking-widest active:scale-95 transition-transform disabled:opacity-50 shrink-0">
            {callbackSent ? 'REQUESTED' : 'CALL ME'}
          </button>
        </div>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-[80px] left-0 right-0 max-w-md mx-auto px-4 z-40">
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full btn-primary-luxury text-white font-bold py-4 rounded-2xl text-sm active:scale-[0.98] transition-transform disabled:opacity-50">
          {submitting ? 'Sending...' : 'Request Corporate Quote'}
        </button>
      </div>
    </div>
  )
}
