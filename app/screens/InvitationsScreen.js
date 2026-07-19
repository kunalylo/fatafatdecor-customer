'use client'

// AI INVITATION STUDIO — Harshal handoff (AI_Invitation_Studio screenshots 01-06).
// Type → Name → Date/Time → Venue → Theme (6 supplied artworks) → Generated
// invitation with overlaid details + pricing + Download Preview (canvas PNG)
// + Share Invitation (WhatsApp). Theme artwork is bundled in /public/studio
// (same-origin, so the canvas export is never tainted).
import { useState, useRef } from 'react'
import {
  ChevronLeft, ArrowRight, Cake, Baby, Heart, Home, Briefcase, Flame,
  Sparkles, Download, Share2, Loader2, Mail,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'

const TYPES = [
  { id: 'birthday',     name: 'Birthday Invitation',     Icon: Cake,      accent: 'accent-peach' },
  { id: 'baby_shower',  name: 'Baby Shower Invitation',  Icon: Baby,      accent: 'accent-lavender' },
  { id: 'anniversary',  name: 'Anniversary Invitation',  Icon: Heart,     accent: 'accent-pink' },
  { id: 'housewarming', name: 'Housewarming Invitation', Icon: Home,      accent: 'accent-mint' },
  { id: 'corporate',    name: 'Corporate Invitation',    Icon: Briefcase, accent: 'accent-lavender' },
  { id: 'festival',     name: 'Festival Invitation',     Icon: Flame,     accent: 'accent-peach' },
]

const THEMES = [
  { id: 'aurora',   kicker: 'EDITORIAL',        name: 'Iridescent Aurora', image: '/studio/invitation_iridescent_aurora_card.jpg', dark: false },
  { id: 'noir',     kicker: 'PREMIUM DARK',     name: 'Velvet Noir',       image: '/studio/invitation_velvet_noir_card.jpg',       dark: true },
  { id: 'garden',   kicker: 'WHIMSICAL',        name: 'Pastel Garden',     image: '/studio/invitation_pastel_garden_card.jpg',     dark: false },
  { id: 'linen',    kicker: 'MODERN MINIMAL',   name: 'Minimal Linen',     image: '/studio/invitation_minimal_linen_card.jpg',     dark: false },
  { id: 'marigold', kicker: 'TRADITIONAL',      name: 'Royal Marigold',    image: '/studio/invitation_royal_marigold_card.jpg',    dark: false },
  { id: 'bubble',   kicker: 'BIRTHDAY PLAYFUL', name: 'Bubble Pop',        image: '/studio/invitation_bubble_pop_card.jpg',        dark: false },
]

const PRICING = [
  { id: 'single',  name: 'Single AI Invite',   desc: 'PNG + WhatsApp ready',      price: '₹ 299' },
  { id: 'premium', name: 'Premium Invite Set', desc: 'Card + video + 5 variations', price: '₹ 999', popular: true },
  { id: 'bundle',  name: 'Invite + Gift Theme', desc: 'Pairs with your AI gift box', price: 'Custom' },
]

const fmtDate = (d) => {
  if (!d) return ''
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return d }
}
const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function InvitationsScreen() {
  const { goBack, showToast, user } = useApp()
  const [step, setStep] = useState(1)      // 1 type, 2 name, 3 date/time, 4 venue, 5 theme, 6 result
  const [type, setType] = useState(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [venue, setVenue] = useState('')
  const [theme, setTheme] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [pkg, setPkg] = useState('single')
  const [busy, setBusy] = useState('')
  const cardRef = useRef(null)

  const canNext =
    (step === 1 && type) || (step === 2 && name.trim()) ||
    (step === 3 && date && time) || (step === 4 && venue.trim()) ||
    (step === 5 && theme)

  const next = () => {
    if (!canNext) return
    if (step === 5) {
      setGenerating(true)
      setTimeout(() => { setGenerating(false); setStep(6) }, 1400)
      return
    }
    setStep(s => s + 1)
  }
  const back = () => (step === 1 ? goBack() : setStep(s => s - 1))

  const whenText = `${fmtDate(date)} · ${fmtTime(time)}`

  // Render the invitation to a PNG via canvas (same-origin artwork — no taint).
  const downloadPreview = async () => {
    if (busy) return
    setBusy('download')
    try {
      const img = new Image()
      img.src = theme.image
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
      const W = img.naturalWidth, H = img.naturalHeight
      const c = document.createElement('canvas')
      c.width = W; c.height = H
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, W, H)
      // Bottom scrim for legibility
      const grad = ctx.createLinearGradient(0, H * 0.42, 0, H)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = grad
      ctx.fillRect(0, H * 0.42, W, H * 0.58)
      const cx = W * 0.08
      ctx.fillStyle = '#ffffff'
      ctx.textBaseline = 'alphabetic'
      const track = (t, y, size, weight = 'bold', spacing = 0.35) => {
        ctx.font = `${weight} ${size}px Arial`
        let x = cx
        for (const ch of t) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + size * spacing }
      }
      track('YOU ARE INVITED', H * 0.56, W * 0.028)
      ctx.font = `italic ${W * 0.085}px Georgia`
      ctx.fillText(name.trim(), cx, H * 0.645)
      ctx.fillRect(cx, H * 0.663, W * 0.5, 2)
      track('WHEN', H * 0.72, W * 0.024)
      ctx.font = `bold ${W * 0.038}px Arial`
      ctx.fillText(whenText, cx, H * 0.765)
      track('WHERE', H * 0.82, W * 0.024)
      ctx.font = `bold ${W * 0.038}px Arial`
      ctx.fillText(venue.trim(), cx, H * 0.865)
      const a = document.createElement('a')
      a.href = c.toDataURL('image/png')
      a.download = `fatafat-invitation-${name.trim().toLowerCase().replace(/\s+/g, '-')}.png`
      a.click()
      showToast('Invitation preview downloaded.', 'success')
    } catch {
      showToast('Could not render the preview. Try again.', 'error')
    }
    setBusy('')
  }

  const shareInvitation = () => {
    const text = encodeURIComponent(
      `You are invited!\n\n${name.trim()}\n${type?.name || 'Celebration'}\n\nWhen: ${whenText}\nWhere: ${venue.trim()}\n\nInvitation by FatafatDecor — fatafatdecor.ylo.co.in`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const requestPackage = async (p) => {
    setPkg(p.id)
    if (p.id === 'single') return
    if (busy) return
    setBusy(p.id)
    const res = await api('leads', {
      method: 'POST',
      body: {
        type: 'gift',
        occasion: type?.name || 'Invitation',
        quantity: 1,
        budget: p.price,
        name: user?.name || name,
        phone: user?.phone || '',
        notes: `Invitation Studio package request: ${p.name} (${p.desc}) · theme ${theme?.name}`,
      },
    })
    setBusy('')
    if (res?.error) return showToast(res.error, 'error')
    showToast(`${p.name} requested — our team will WhatsApp you shortly.`, 'success')
  }

  const StepShell = ({ eyebrow, line1, line2, sub, children }) => (
    <div className="px-6 pt-6">
      <div className="mb-6">
        {eyebrow && <p className="eyebrow text-gray-500 mb-2">{eyebrow}</p>}
        <h1 className="font-display text-4xl text-gray-900 leading-tight">
          {line1}{line2 ? <><br /><span className="italic iridescent-text">{line2}</span></> : null}
        </h1>
        {sub && <p className="text-sm text-gray-600 mt-2">{sub}</p>}
      </div>
      {children}
    </div>
  )

  const inputCls = 'w-full glass-card rounded-2xl px-4 py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 border border-white/80 focus:border-pink-300'

  return (
    <div className="min-h-screen bg-aurora pb-28 fade-in">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-overlay px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={back} className="w-9 h-9 rounded-full glass-card flex items-center justify-center flex-shrink-0">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-[9px] font-bold tracking-[0.3em] text-gray-500">AI STUDIO</p>
          <h2 className="font-display text-lg text-gray-900 leading-tight">Invitation Studio</h2>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`rounded-full transition-all ${i <= step ? 'w-3.5 h-1.5 bg-pink-500' : 'w-1.5 h-1.5 bg-gray-300'}`} />
          ))}
        </div>
      </div>

      {/* STEP 1 — Type */}
      {step === 1 && (
        <StepShell eyebrow="FOR WHATSAPP · PRINT · EVENT" line1="AI" line2="Invitation Studio" sub="Pick what you're inviting for.">
          <div className="grid grid-cols-2 gap-3">
            {TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t)}
                className={`glass-floating rounded-[22px] p-4 text-left transition-all ${type?.id === t.id ? 'ring-2 ring-orange-300 shadow-lg' : ''}`}>
                <div className={`w-11 h-11 rounded-2xl ${t.accent} flex items-center justify-center mb-3 opacity-90`}>
                  <t.Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{t.name}</p>
              </button>
            ))}
          </div>
        </StepShell>
      )}

      {/* STEP 2 — Name */}
      {step === 2 && (
        <StepShell eyebrow="STEP 2 OF 5" line1="Whose celebration?" sub="Type the name of the celebrant or host.">
          <label className="block text-xs font-bold text-gray-700 mb-2">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Aanya Mehra" className={inputCls} autoFocus />
        </StepShell>
      )}

      {/* STEP 3 — Date & time */}
      {step === 3 && (
        <StepShell eyebrow="STEP 3 OF 5" line1="When is it?" sub="Pick the event date and time.">
          <label className="block text-xs font-bold text-gray-700 mb-2">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          <label className="block text-xs font-bold text-gray-700 mb-2 mt-4">Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
          {date && time && <p className="text-xs text-gray-500 mt-3">On the invite: <span className="font-bold text-gray-800">{whenText}</span></p>}
        </StepShell>
      )}

      {/* STEP 4 — Venue */}
      {step === 4 && (
        <StepShell eyebrow="STEP 4 OF 5" line1="Where is it?" sub="Venue name and area, exactly as it should appear.">
          <label className="block text-xs font-bold text-gray-700 mb-2">Venue</label>
          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="The Pearl, Lalpur, Ranchi" className={inputCls} autoFocus />
        </StepShell>
      )}

      {/* STEP 5 — Theme */}
      {step === 5 && (
        <StepShell eyebrow="STEP 5 OF 5" line1="Pick a" line2="theme" sub="All six designs are crafted by our studio.">
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t)}
                className={`relative rounded-[22px] overflow-hidden text-left transition-all ${theme?.id === t.id ? 'ring-2 ring-pink-500 shadow-lg' : ''}`}>
                <div className="aspect-[4/5]">
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {theme?.id === t.id && (
                  <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center">&#10003;</span>
                )}
                <div className="absolute bottom-2.5 left-3 right-3">
                  <p className="text-[8px] font-bold tracking-[0.2em] text-white/70">{t.kicker}</p>
                  <p className="text-xs font-bold text-white mt-0.5">{t.name}</p>
                </div>
              </button>
            ))}
          </div>
        </StepShell>
      )}

      {/* STEP 6 — Generated invitation */}
      {step === 6 && theme && (
        <div className="pt-4">
          {/* The invitation card */}
          <div ref={cardRef} className="relative mx-4 rounded-[24px] overflow-hidden shadow-xl">
            <div className="aspect-[4/5]">
              <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <p className="absolute top-4 left-5 text-[9px] font-bold tracking-[0.35em] text-white/60">
              WHATSAPP · {(type?.id || 'EVENT').replace('_', ' ').toUpperCase()}
            </p>
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[10px] font-bold tracking-[0.35em] text-white/85">YOU ARE INVITED</p>
              <p className="font-display italic text-4xl text-white mt-2 leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>{name.trim()}</p>
              <div className="w-2/3 h-px bg-white/50 my-3" />
              <p className="text-[9px] font-bold tracking-[0.3em] text-white/70">WHEN</p>
              <p className="text-sm font-bold text-white mt-0.5">{whenText}</p>
              <p className="text-[9px] font-bold tracking-[0.3em] text-white/70 mt-2.5">WHERE</p>
              <p className="text-sm font-bold text-white mt-0.5">{venue.trim()}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 px-4 mt-4">
            <button onClick={downloadPreview} disabled={!!busy}
              className="flex-1 py-3.5 rounded-full bg-white border border-gray-100 flex items-center justify-center gap-2 text-sm font-bold text-gray-800 disabled:opacity-50">
              {busy === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download Preview
            </button>
            <button onClick={shareInvitation}
              className="flex-[1.2] py-3.5 rounded-full btn-primary-luxury text-white flex items-center justify-center gap-2 text-sm font-bold">
              <Share2 className="w-4 h-4" /> Share Invitation
            </button>
          </div>

          {/* Pricing */}
          <div className="px-4 mt-6">
            <p className="eyebrow text-gray-500 mb-3">PRICING</p>
            <div className="space-y-3">
              {PRICING.map(p => (
                <button key={p.id} onClick={() => requestPackage(p)} disabled={!!busy && busy !== p.id}
                  className={`w-full glass-floating rounded-[20px] p-4 flex items-center gap-3 text-left transition-all ${pkg === p.id ? 'ring-2 ring-pink-400' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl ${pkg === p.id ? 'iridescent' : 'bg-white'} flex items-center justify-center flex-shrink-0 border border-white/70`}>
                    <Mail className={`w-4 h-4 ${pkg === p.id ? 'text-white' : 'text-gray-700'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{p.name}</p>
                      {p.popular && <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[9px] font-bold tracking-wider">POPULAR</span>}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                  </div>
                  <p className="text-base font-bold text-gray-900 flex-shrink-0">
                    {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : p.price}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              Premium sets are prepared by our design team — tap to request and we&apos;ll WhatsApp you.
            </p>
          </div>
        </div>
      )}

      {/* Fixed CTA (steps 1-5) */}
      {step < 6 && (
        <div className="fixed bottom-[92px] left-0 right-0 max-w-md mx-auto px-6 z-40">
          <button onClick={next} disabled={!canNext || generating}
            className="w-full py-4 rounded-full btn-primary-luxury text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating invite</>
              : step === 5
                ? <><Sparkles className="w-4 h-4" /> Generate Invite</>
                : <>Next <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}
    </div>
  )
}
