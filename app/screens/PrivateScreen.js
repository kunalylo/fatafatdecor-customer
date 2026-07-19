'use client'

// PRIVATE "Velvet" COLLECTION — the one dark screen in the app.
// Members-only editions: images blur-locked until an invite code is verified
// server-side (POST /private/unlock). Prices are never sent by the API.
import { useState, useEffect } from 'react'
import {
  ChevronLeft, Lock, Sparkles, Baby, Briefcase, Flame, Heart, Wand2, MailOpen,
  MapPin, MessageCircle, ShieldCheck, Phone, Check, X, Loader2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'

const GOLD = '#E5C589'
const GOLD_GRAD = 'linear-gradient(135deg,#E5C589,#C9A45B)'
const PAGE_GRAD = 'linear-gradient(180deg,#1a1126 0%,#221530 35%,#2c1a3a 100%)'
const CARD_BG = 'rgba(255,255,255,0.05)'
const CARD_BORDER = '1px solid rgba(229,197,137,0.15)'

const TYPE_ICONS = { Baby, Briefcase, Flame, Heart, Wand2, MailOpen }

function DarkField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: GOLD }}>{label}</label>
      {children}
    </div>
  )
}

const darkInputCls = 'w-full rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/30'
const darkInputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(229,197,137,0.2)' }

export default function PrivateScreen() {
  const { goBack, showToast, user } = useApp()

  const [data, setData] = useState(null)
  const [unlocked, setUnlocked] = useState(false)
  const [showCodeSheet, setShowCodeSheet] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Lead form
  const [name, setName] = useState(user?.name || '')
  const [mobile, setMobile] = useState(user?.phone || '')
  const [city, setCity] = useState('')
  const [occasion, setOccasion] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [qty, setQty] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    try { if (localStorage.getItem('fd_velvet_unlocked')) setUnlocked(true) } catch {}
    api('private/collection').then(d => { if (!d?.error) setData(d) })
  }, [])

  const tryUnlock = async () => {
    const c = code.trim().toUpperCase()
    if (!c || checking) return
    setChecking(true)
    const res = await api('private/unlock', { method: 'POST', body: { code: c } })
    setChecking(false)
    if (res?.valid) {
      setUnlocked(true)
      try { localStorage.setItem('fd_velvet_unlocked', c) } catch {}
      setShowCodeSheet(false)
      showToast('Welcome to Velvet — your access has been granted.', 'success')
    } else {
      setCodeError(true)
      setTimeout(() => setCodeError(false), 900)
    }
  }

  const submitRequest = async () => {
    if (!name || mobile.length < 6 || !city || !occasion || submitting) return
    setSubmitting(true)
    let unlockedCode = ''
    try { unlockedCode = localStorage.getItem('fd_velvet_unlocked') || '' } catch {}
    const res = await api('leads', {
      method: 'POST',
      body: { type: 'private', name, mobile, city, occasion, budgetRange, qty: Number(qty) || 0, date, unlockedCode },
    })
    setSubmitting(false)
    if (res?.error) return showToast(res.error, 'error')
    showToast('Private request received — our team will WhatsApp you a curated selection.', 'success')
    goBack()
  }

  const canSubmit = name && mobile.length > 5 && city && occasion

  return (
    <div className="min-h-screen pb-28 fade-in relative overflow-hidden" style={{ background: PAGE_GRAD }}>
      {/* Glow orbs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,197,137,0.3), transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute top-72 -left-20 w-56 h-56 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(184,154,255,0.15), transparent 70%)', filter: 'blur(40px)' }} />

      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-4" style={{ background: 'rgba(26,17,38,0.85)', backdropFilter: 'blur(14px)' }}>
        <button onClick={goBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD_BG, border: CARD_BORDER }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.32em]" style={{ color: GOLD }}>VELVET</p>
          <h1 className="font-display text-lg text-white leading-tight">Private collection</h1>
        </div>
        <button onClick={() => setShowCodeSheet(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: CARD_BG, border: CARD_BORDER }}>
          {unlocked ? <Check className="w-4 h-4" style={{ color: GOLD }} /> : <Lock className="w-4 h-4" style={{ color: GOLD }} />}
        </button>
      </div>

      <div className="px-6 pt-6 space-y-8 relative z-10">
        {/* Hero */}
        <section>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: CARD_BG, border: CARD_BORDER }}>
            <Sparkles className="w-3 h-3" style={{ color: GOLD }} />
            <span className="text-[10px] font-bold tracking-[0.25em]" style={{ color: GOLD }}>MEMBERS ONLY</span>
          </div>
          <h2 className="font-display text-4xl text-white leading-tight">
            Private premium<br />
            <span className="italic" style={{ color: GOLD }}>gift selection</span>
          </h2>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">Curated boxes and hampers not visible in the public catalogue.</p>
        </section>

        {/* Why private */}
        <section className="rounded-[24px] p-5" style={{ background: CARD_BG, border: CARD_BORDER }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: GOLD_GRAD }}>
            <Lock className="w-5 h-5 text-white" />
          </div>
          <p className="text-[10px] font-bold tracking-[0.25em] mb-1" style={{ color: GOLD }}>WHY PRIVATE?</p>
          <h3 className="font-display text-xl text-white mb-1.5">Different by design</h3>
          <p className="text-white/55 text-xs leading-relaxed">For customers who want gifts that look different from everyone else.</p>
        </section>

        {/* Category types */}
        {data?.types?.length > 0 && (
          <section className="grid grid-cols-2 gap-2.5">
            {data.types.map(t => {
              const Icon = TYPE_ICONS[t.icon] || Sparkles
              return (
                <div key={t.id} className="rounded-[18px] p-3.5 flex items-center gap-2.5" style={{ background: CARD_BG, border: CARD_BORDER }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.tint || 'rgba(229,197,137,0.18)' }}>
                    <Icon className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                  <p className="text-[11px] font-bold text-white/85 leading-tight">{t.name}</p>
                </div>
              )
            })}
          </section>
        )}

        {/* Private editions grid */}
        {data?.items?.length > 0 && (
          <section>
            <p className="text-[10px] font-bold tracking-[0.25em] mb-3" style={{ color: GOLD }}>PRIVATE EDITIONS</p>
            <div className="space-y-4">
              {data.items.slice(0, unlocked ? data.items.length : 2).map(item => (
                <div key={item.id} className="rounded-[24px] overflow-hidden" style={{ background: CARD_BG, border: CARD_BORDER }}>
                  <div className="relative aspect-video overflow-hidden">
                    <img src={item.image} alt={item.name}
                      className={`w-full h-full object-cover ${unlocked ? '' : 'blur-md scale-110'}`} />
                    {!unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button onClick={() => setShowCodeSheet(true)} className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: GOLD_GRAD }}>
                          <Lock className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: GOLD }}>{item.edition}</p>
                    <h4 className="font-display text-lg text-white mb-1">{item.name}</h4>
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Request access form */}
        <section className="rounded-[24px] p-5" style={{ background: CARD_BG, border: CARD_BORDER }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: GOLD_GRAD }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em]" style={{ color: GOLD }}>REQUEST</p>
              <h3 className="font-display text-lg text-white leading-tight">Request private options</h3>
            </div>
          </div>
          <DarkField label="Name">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Aanya Mehra" className={darkInputCls} style={darkInputStyle} />
          </DarkField>
          <DarkField label="Mobile">
            <input value={mobile} onChange={e => setMobile(e.target.value.replace(/[^\d+ ]/g, ''))} placeholder="+91 9876543210" className={darkInputCls} style={darkInputStyle} />
          </DarkField>
          <div className="grid grid-cols-2 gap-3">
            <DarkField label="City">
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ranchi" className={`${darkInputCls} pl-8`} style={darkInputStyle} />
              </div>
            </DarkField>
            <DarkField label="Occasion">
              <input value={occasion} onChange={e => setOccasion(e.target.value)} placeholder="Wedding" className={darkInputCls} style={darkInputStyle} />
            </DarkField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DarkField label="Budget range">
              <input value={budgetRange} onChange={e => setBudgetRange(e.target.value)} placeholder="₹ 10K – 50K" className={darkInputCls} style={darkInputStyle} />
            </DarkField>
            <DarkField label="Quantity">
              <input value={qty} onChange={e => setQty(e.target.value.replace(/\D/g, ''))} placeholder="10" className={darkInputCls} style={darkInputStyle} />
            </DarkField>
          </div>
          <DarkField label="Delivery date">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={darkInputCls} style={{ ...darkInputStyle, colorScheme: 'dark' }} />
          </DarkField>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mt-1" style={{ background: 'rgba(229,197,137,0.08)', border: CARD_BORDER }}>
            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
            <p className="text-[11px] text-white/60">Our team will share a curated selection on WhatsApp.</p>
          </div>
        </section>

        {/* Perks */}
        {data?.perks?.length > 0 && (
          <section className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-6 px-6">
            {data.perks.map((p, i) => (
              <div key={i} className="flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2" style={{ background: CARD_BG, border: CARD_BORDER }}>
                <Check className="w-3 h-3" style={{ color: GOLD }} />
                <span className="text-[10px] font-semibold text-white/75 whitespace-nowrap">{p}</span>
              </div>
            ))}
          </section>
        )}

        {/* Trust line */}
        <div className="flex items-center justify-center gap-2 pb-2">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <p className="text-[9px] font-bold tracking-[0.2em] text-white/40">BY INVITATION · NDA-BOUND · CONCIERGE HANDLED</p>
        </div>

        {/* CTAs */}
        <div className="space-y-2.5 pb-4">
          {unlocked && (
            <button onClick={() => showToast('Concierge notified — they will reach out within 1 hour.', 'success')}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold"
              style={{ border: `1.5px solid ${GOLD}`, color: GOLD, background: 'transparent' }}>
              <Phone className="w-4 h-4" /> Concierge
            </button>
          )}
          <button onClick={submitRequest} disabled={!canSubmit || submitting}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40"
            style={{ background: GOLD_GRAD, boxShadow: '0 14px 30px -10px rgba(229,197,137,0.4)' }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Private Options'}
          </button>
        </div>
      </div>

      {/* ── Invite code sheet ── */}
      {showCodeSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center max-w-md mx-auto" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCodeSheet(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full rounded-t-[28px] p-6 pb-10 relative overflow-hidden"
            style={{ background: PAGE_GRAD, borderTop: CARD_BORDER }}>
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,197,137,0.25), transparent 70%)', filter: 'blur(30px)' }} />
            <button onClick={() => setShowCodeSheet(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: CARD_BG, border: CARD_BORDER }}>
              <X className="w-4 h-4 text-white/70" />
            </button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: GOLD_GRAD }}>
              <Lock className="w-5 h-5 text-white" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.3em] mb-1.5" style={{ color: GOLD }}>VELVET · MEMBERS ONLY</p>
            <h3 className="font-display text-3xl text-white leading-tight mb-2">
              Enter your<br /><span className="italic" style={{ color: GOLD }}>invite code</span>
            </h3>
            <p className="text-white/55 text-xs leading-relaxed mb-5">
              The Velvet Collection is by invitation only. Don&apos;t have a code? Use &quot;Request Private Options&quot; below.
            </p>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase().slice(0, 16)); setCodeError(false) }}
              onKeyDown={e => e.key === 'Enter' && tryUnlock()}
              placeholder="ENTER CODE"
              className="w-full rounded-xl px-4 py-4 text-center text-lg font-mono tracking-[0.3em] text-white outline-none placeholder:text-white/25"
              style={{ background: 'rgba(255,255,255,0.06)', border: codeError ? '1.5px solid #ef4444' : '1px solid rgba(229,197,137,0.3)' }}
            />
            <button onClick={tryUnlock} disabled={!code.trim() || checking}
              className="w-full mt-4 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: GOLD_GRAD }}>
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock collection'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
