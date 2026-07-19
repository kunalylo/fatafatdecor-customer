'use client'

// AI GIFT BOX — 5-step builder (Harshal handoff: AI_Gift_Box screenshots 01-07).
// Occasion → Quantity → Budget → Theme → 3 generated options with Save/Callback.
// Option pricing follows the handoff formula: perUnit = min + range×(0.2|0.6|0.4)
// (reproduces the screenshot prices ₹679/₹839/₹759 for Premium ₹599–999 exactly),
// total = perUnit × qty. Save/Callback create leads (type 'gift').
import { useState } from 'react'
import {
  ChevronLeft, ArrowRight, Cake, Baby, Briefcase, Flame, Heart, Home,
  Bookmark, Phone, Sparkles, Loader2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/constants'

const OCCASIONS = [
  { id: 'birthday',     name: 'Birthday',     Icon: Cake,      accent: 'accent-peach' },
  { id: 'baby_shower',  name: 'Baby Shower',  Icon: Baby,      accent: 'accent-lavender' },
  { id: 'corporate',    name: 'Corporate',    Icon: Briefcase, accent: 'accent-mint' },
  { id: 'festival',     name: 'Festival',     Icon: Flame,     accent: 'accent-peach' },
  { id: 'anniversary',  name: 'Anniversary',  Icon: Heart,     accent: 'accent-pink' },
  { id: 'housewarming', name: 'Housewarming', Icon: Home,      accent: 'accent-mint' },
]

const QUANTITIES = [
  { id: 20,  label: '20' },
  { id: 30,  label: '30' },
  { id: 50,  label: '50' },
  { id: 100, label: '100+' },
]

const BUDGETS = [
  { id: 'starter',   label: '₹149–₹249',     tier: 'STARTER',   min: 149,  max: 249 },
  { id: 'mid',       label: '₹299–₹499',     tier: 'MID',       min: 299,  max: 499 },
  { id: 'premium',   label: '₹599–₹999',     tier: 'PREMIUM',   min: 599,  max: 999, popular: true },
  { id: 'signature', label: '₹1,000–₹1,999', tier: 'SIGNATURE', min: 1000, max: 1999 },
  { id: 'luxe',      label: '₹2,000+',       tier: 'LUXE',      min: 2000, max: 3000 },
]

const THEMES = [
  { id: 'pastel',      name: 'Pastel',            dot: 'linear-gradient(135deg,#FFD4B5,#FFB088)' },
  { id: 'royal',       name: 'Royal',             dot: 'linear-gradient(135deg,#E0D0FF,#B89AFF)' },
  { id: 'minimal',     name: 'Minimal',           dot: 'linear-gradient(135deg,#C5F3D6,#88E0AA)' },
  { id: 'kids',        name: 'Kids',              dot: 'linear-gradient(135deg,#FFC8DC,#FF8AB0)' },
  { id: 'traditional', name: 'Traditional',       dot: 'linear-gradient(135deg,#FFD4B5,#FFB088)' },
  { id: 'corp',        name: 'Corporate Premium', dot: 'linear-gradient(135deg,#E0D0FF,#B89AFF)' },
  { id: 'festive',     name: 'Festive',           dot: 'linear-gradient(135deg,#FFC8DC,#FF8AB0)' },
]

// The three generated options — artwork bundled in /public/studio.
const OPTIONS = [
  { n: 1, name: 'Budget Friendly', factor: 0.2, delivery: '3–4 days', image: '/studio/gift_option_1_budget_friendly.jpg',
    features: 'Curated mini-treats · Themed wrap · Handwritten card' },
  { n: 2, name: 'Premium Look',    factor: 0.6, delivery: '4–5 days', image: '/studio/gift_option_2_premium_look.jpg', popular: true,
    features: 'Premium chocolate · Custom note · Velvet-finish box · Ribbon' },
  { n: 3, name: 'Best Value',      factor: 0.4, delivery: '3–5 days', image: '/studio/gift_option_3_best_value.jpg',
    features: 'Curated 4-item set · Theme wrap · Greeting card · Free monogram' },
]

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function GiftBuilderScreen() {
  const { goBack, showToast, user } = useApp()
  const [step, setStep] = useState(1)
  const [occasion, setOccasion] = useState(null)
  const [qty, setQty] = useState(null)
  const [budget, setBudget] = useState(null)
  const [theme, setTheme] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [busyAction, setBusyAction] = useState('')

  const canNext =
    (step === 1 && occasion) || (step === 2 && qty) ||
    (step === 3 && budget) || (step === 4 && theme) || step === 5

  const next = () => {
    if (!canNext) return
    if (step === 4) {
      setGenerating(true)
      setTimeout(() => { setGenerating(false); setStep(5) }, 1400)
      return
    }
    setStep(s => Math.min(5, s + 1))
  }
  const back = () => (step === 1 ? goBack() : setStep(s => s - 1))

  const sendLead = async (option, kind) => {
    const key = `${option.n}-${kind}`
    if (busyAction) return
    setBusyAction(key)
    const perUnit = Math.round(budget.min + (budget.max - budget.min) * option.factor)
    const res = await api('leads', {
      method: 'POST',
      body: {
        type: 'gift',
        occasion: occasion.name,
        quantity: qty.id,
        budget: `${budget.label} · Option ${option.n} ${option.name} @ ${fmt(perUnit)}/unit`,
        theme: theme.name,
        name: user?.name || '',
        phone: user?.phone || '',
        notes: kind === 'save'
          ? `Saved AI gift option: ${option.name} (${option.features})`
          : `Callback requested for AI gift option: ${option.name}`,
      },
    })
    setBusyAction('')
    if (res?.error) return showToast(res.error, 'error')
    showToast(kind === 'save'
      ? 'Option saved — find it under Orders › Enquiries.'
      : 'Callback requested — our team will call you shortly.', 'success')
  }

  const StepTitle = ({ line1, line2 }) => (
    <div className="mb-6">
      <p className="eyebrow text-gray-500 mb-2">STEP {step} OF 5</p>
      <h1 className="font-display text-4xl text-gray-900 leading-tight">
        {line1}<br /><span className="italic iridescent-text">{line2}</span>
      </h1>
    </div>
  )

  return (
    <div className="min-h-screen bg-aurora pb-28 fade-in">
      {/* Progress header */}
      <div className="sticky top-0 z-30 glass-overlay px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={back} className="w-9 h-9 rounded-full glass-card flex items-center justify-center flex-shrink-0">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1 flex gap-1.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-pink-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <span className="text-xs font-bold text-gray-500 flex-shrink-0">{step}/5</span>
      </div>

      <div className="px-6 pt-6">
        {/* STEP 1 — Occasion */}
        {step === 1 && (
          <>
            <StepTitle line1="Pick your" line2="occasion" />
            <div className="grid grid-cols-2 gap-3">
              {OCCASIONS.map(o => (
                <button key={o.id} onClick={() => setOccasion(o)}
                  className={`glass-floating rounded-[22px] p-4 text-left transition-all ${occasion?.id === o.id ? 'ring-2 ring-orange-300 shadow-lg' : ''}`}>
                  <div className={`w-11 h-11 rounded-2xl ${occasion?.id === o.id ? 'iridescent' : 'bg-white'} flex items-center justify-center mb-3 border border-white/70`}>
                    <o.Icon className={`w-5 h-5 ${occasion?.id === o.id ? 'text-white' : 'text-gray-700'}`} strokeWidth={2.2} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{o.name}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 — Quantity */}
        {step === 2 && (
          <>
            <StepTitle line1="How many" line2="gifts?" />
            <div className="grid grid-cols-2 gap-3">
              {QUANTITIES.map(q => (
                <button key={q.id} onClick={() => setQty(q)}
                  className={`glass-floating rounded-[22px] py-6 text-center transition-all ${qty?.id === q.id ? 'ring-2 ring-orange-300 shadow-lg' : ''}`}>
                  <p className="font-display text-3xl text-gray-900">{q.label}</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 mt-1">UNITS</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 3 — Budget */}
        {step === 3 && (
          <>
            <StepTitle line1="Budget" line2="per piece" />
            <div className="space-y-3">
              {BUDGETS.map(b => (
                <button key={b.id} onClick={() => setBudget(b)}
                  className={`w-full glass-floating rounded-[20px] p-4 flex items-center gap-3 text-left transition-all ${budget?.id === b.id ? 'ring-2 ring-orange-300 shadow-lg' : ''}`}>
                  <div className={`w-11 h-11 rounded-2xl ${budget?.id === b.id ? 'iridescent' : 'bg-white'} flex items-center justify-center flex-shrink-0 border border-white/70`}>
                    <span className={`text-base font-bold ${budget?.id === b.id ? 'text-white' : 'text-gray-700'}`}>₹</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{b.label}</p>
                      {b.popular && <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[9px] font-bold tracking-wider">POPULAR</span>}
                    </div>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-gray-500 mt-0.5">{b.tier}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${budget?.id === b.id ? 'bg-pink-500' : 'border-2 border-gray-200'}`}>
                    {budget?.id === b.id && <span className="text-white text-xs font-bold">&#10003;</span>}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 4 — Theme */}
        {step === 4 && (
          <>
            <StepTitle line1="Choose a" line2="theme" />
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t)}
                  className={`glass-floating rounded-[22px] p-4 text-left transition-all ${theme?.id === t.id ? 'ring-2 ring-orange-300 shadow-lg' : ''}`}>
                  <div className="w-10 h-10 rounded-full mb-3" style={{ background: t.dot }} />
                  <p className="text-sm font-bold text-gray-900 leading-tight">{t.name}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP 5 — Generated options */}
        {step === 5 && budget && qty && (
          <>
            <div className="mb-5">
              <p className="eyebrow text-gray-500 mb-2">STEP 5 OF 5</p>
              <h1 className="font-display text-4xl text-gray-900 leading-tight">
                Your AI<br /><span className="italic iridescent-text">gift options</span>
              </h1>
              <p className="text-sm text-gray-600 mt-2">Three curated picks for your {qty.label} units.</p>
            </div>
            <div className="space-y-5">
              {OPTIONS.map(opt => {
                const perUnit = Math.round(budget.min + (budget.max - budget.min) * opt.factor)
                const total = perUnit * (qty.id === 100 ? 100 : qty.id)
                return (
                  <div key={opt.n} className="glass-floating rounded-[26px] overflow-hidden">
                    <div className="relative aspect-square">
                      <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" loading="lazy" />
                      {opt.popular && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-pink-600 text-white text-[9px] font-bold tracking-widest">POPULAR</span>
                      )}
                      <div className="absolute bottom-3 left-3 w-9 h-9 rounded-full glass-overlay flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-pink-600" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-base">Option {opt.n} · {opt.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-1">{opt.features}</p>
                      <div className="flex items-end justify-between mt-4">
                        <div>
                          <p className="text-[9px] font-bold tracking-[0.15em] text-gray-500">PER UNIT</p>
                          <p className="text-lg font-bold text-gray-900">{fmt(perUnit)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold tracking-[0.15em] text-gray-500">TOTAL</p>
                          <p className="text-lg font-bold text-gray-900">{fmt(total)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold tracking-[0.15em] text-gray-500">DELIVERY</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{opt.delivery}</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5 mt-4">
                        <button onClick={() => sendLead(opt, 'save')} disabled={!!busyAction}
                          className="flex-1 py-3 rounded-full bg-white border border-gray-100 flex items-center justify-center gap-1.5 text-sm font-bold text-gray-800 disabled:opacity-50">
                          {busyAction === `${opt.n}-save` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />} Save
                        </button>
                        <button onClick={() => sendLead(opt, 'callback')} disabled={!!busyAction}
                          className="flex-[1.4] py-3 rounded-full btn-primary-luxury text-white flex items-center justify-center gap-1.5 text-sm font-bold disabled:opacity-50">
                          {busyAction === `${opt.n}-callback` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />} Callback
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="glass-card rounded-2xl px-4 py-3 mt-5 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <p className="text-[11px] text-gray-600">Final pricing will be confirmed after stock and customization check.</p>
            </div>
          </>
        )}
      </div>

      {/* Fixed CTA (steps 1-4) */}
      {step < 5 && (
        <div className="fixed bottom-[92px] left-0 right-0 max-w-md mx-auto px-6 z-40">
          <button onClick={next} disabled={!canNext || generating}
            className="w-full py-4 rounded-full btn-primary-luxury text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
            {generating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating options</>
              : step === 4
                ? <>Generate options <ArrowRight className="w-4 h-4" /></>
                : <>Next <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}
    </div>
  )
}
