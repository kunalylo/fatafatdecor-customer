'use client'

import { useState } from 'react'
import { ChevronLeft, Wand2, Coins, IndianRupee, AlertCircle, Loader2, ShieldCheck, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, CREDIT_PACKAGES } from '../lib/constants'

const SINGLE_CREDIT_PRICE = CREDIT_PACKAGES.find(p => p.credits === 1)?.price || 0

const packValueLabel = (pkg) => pkg.credits === 1 ? 'Starter' : pkg.popular ? 'Best value' : 'Pro pack'
const packSavePercent = (pkg) => {
  if (!SINGLE_CREDIT_PRICE || pkg.credits <= 1) return 0
  return Math.max(0, Math.round((1 - pkg.price / (pkg.credits * SINGLE_CREDIT_PRICE)) * 100))
}

const USPRow = ({ num, title, desc }) => (
  <div className="flex gap-3">
    <span className="font-display text-[22px] font-medium text-pink-600 tabular-nums leading-none flex-shrink-0 mt-0.5">{num}</span>
    <div>
      <p className="text-[13px] font-bold text-gray-900 leading-tight">{title}</p>
      <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
)

export default function CreditsScreen() {
  const { user, navigate, handlePayment, loading } = useApp()
  const [paymentError, setPaymentError] = useState(null)
  const [selected, setSelected] = useState(() => (CREDIT_PACKAGES.find(p => p.popular) || CREDIT_PACKAGES[0]).credits)

  const credits = user?.credits || 0
  const pack = CREDIT_PACKAGES.find(p => p.credits === selected) || CREDIT_PACKAGES[0]

  const handleBuy = async (pkg) => {
    setPaymentError(null)
    try {
      await handlePayment('credits', pkg.price, null, pkg.credits)
    } catch {
      setPaymentError('Payment failed. Please try again.')
    }
  }

  return (
  <div className="slide-up pb-44 bg-aurora min-h-screen relative overflow-hidden">
    <div className="iridescent-orb absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none" />

    <div className="relative z-10">
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={() => navigate(SCREENS.HOME)} className="w-9 h-9 rounded-full glass-card flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <div>
          <p className="eyebrow text-gray-400">Top up</p>
          <h1 className="font-display text-2xl text-gray-900 leading-tight">Decor Preview <span className="italic iridescent-text">credits</span></h1>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* Editorial intro */}
        <div>
          <p className="eyebrow text-gray-500 mb-2">Free for new users</p>
          <h2 className="font-display text-3xl font-medium text-gray-900 leading-tight">
            You get 3 free<br/>
            <span className="italic font-normal iridescent-text">decor previews</span>
          </h2>
          <p className="text-gray-600 text-sm mt-2">Each preview uses 1 credit.</p>
        </div>

        {/* Why credits matter */}
        <div className="glass-floating rounded-[28px] p-5">
          <p className="text-pink-600 text-[10px] font-bold tracking-widest uppercase">Why credits matter</p>
          <h3 className="font-display text-2xl font-medium text-gray-900 mt-1 leading-tight mb-4">See your room <span className="italic">before</span> you book</h3>
          <div className="space-y-3">
            <USPRow num="01" title="Understand your space" desc="See exactly how decor will look in your room — no surprises on the day." />
            <USPRow num="02" title="Stand out, every time" desc="Stop sending the same return gifts everyone else does. Personalise every detail." />
            <USPRow num="03" title="Confident booking" desc="Approve the AI design first, then book decorators with one tap." />
          </div>
        </div>

        {/* Credit balance card */}
        <div className="glass-floating rounded-[28px] p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl iridescent aurora-shimmer flex items-center justify-center flex-shrink-0 border border-white/50">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-gray-500">Credits left</p>
            <p className="font-display text-3xl font-medium text-gray-900 mt-0.5 tabular-nums">{credits}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">{credits === 0 ? 'Top up to keep previewing' : `${credits === 1 ? '1 preview' : `${credits} previews`} remaining`}</p>
          </div>
          <Coins className="w-5 h-5 text-amber-600 flex-shrink-0" />
        </div>

        {/* Payment error banner */}
        {paymentError && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-600">Payment Failed</p>
              <p className="text-xs text-red-400 mt-0.5">{paymentError}</p>
            </div>
          </div>
        )}

        {/* Packs */}
        <div className="space-y-3">
          <p className="eyebrow text-gray-600 mb-1">Choose a pack</p>
          {CREDIT_PACKAGES.map(pkg => {
            const isActive = selected === pkg.credits
            const save = packSavePercent(pkg)
            return (
              <button key={pkg.credits}
                onClick={() => setSelected(pkg.credits)}
                className={`w-full text-left glass-floating rounded-[22px] p-4 flex items-center gap-4 transition-all ${isActive ? 'ring-2 ring-pink-500' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/60 ${isActive ? 'iridescent' : 'glass-card'}`}>
                  <Wand2 className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-[15px]">{pkg.credits} {pkg.credits === 1 ? 'Credit' : 'Credits'}</h3>
                    {pkg.popular && (
                      <span className="text-[9px] font-bold text-pink-700 tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-pink-100">Popular</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-600 tracking-wider uppercase">{packValueLabel(pkg)}</span>
                    {save > 0 && (
                      <span className="text-[10px] font-bold text-green-700">&middot; Save {save}%</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900 tabular-nums flex items-center justify-end"><IndianRupee className="w-4 h-4" />{pkg.price}</p>
                  {isActive ? (
                    <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center mt-1 ml-auto">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 mt-1 ml-auto" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Trust */}
        <div className="flex items-start gap-2 px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-700 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Pay once &middot; use anytime &middot; credits never expire.
          </p>
        </div>
      </div>
    </div>

    {/* Sticky buy button */}
    <div className="fixed bottom-[80px] left-0 right-0 max-w-md mx-auto px-4 z-40">
      <button
        onClick={() => !loading && handleBuy(pack)}
        disabled={loading}
        className="w-full btn-primary-luxury py-4 rounded-full font-bold text-sm tracking-wide flex items-center justify-center gap-2 text-white disabled:opacity-60"
        style={{ boxShadow: '0 18px 40px -14px rgba(232,130,175,0.55)' }}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <IndianRupee className="w-4 h-4" strokeWidth={2.4} />
            Buy Now &middot; {pack.price}
          </>
        )}
      </button>
    </div>
  </div>
)
}
