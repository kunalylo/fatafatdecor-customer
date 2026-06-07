'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Zap, IndianRupee, AlertCircle, Loader2, ScanSearch, Sparkles, ShieldCheck, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, CREDIT_PACKAGES } from '../lib/constants'

const WHY_CREDITS = [
  { icon: ScanSearch, title: 'Understand your space', desc: 'See your actual room transformed before you spend a rupee.' },
  { icon: Sparkles,   title: 'Stand out, every time', desc: 'Designer-grade decor concepts tailored to your occasion.' },
  { icon: ShieldCheck, title: 'Book with confidence', desc: 'Preview, tweak, then book — no surprises on the day.' },
]

export default function CreditsScreen() {
  const { user, navigate, handlePayment, loading } = useApp()
  const [paymentError, setPaymentError] = useState(null)

  const handleBuy = async (pkg) => {
    setPaymentError(null)
    try {
      await handlePayment('credits', pkg.price, null, pkg.credits)
    } catch {
      setPaymentError('Payment failed. Please try again.')
    }
  }

  return (
  <div className="slide-up pb-28 bg-aurora min-h-screen relative overflow-hidden">
    <div className="iridescent-orb absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none" />

    <div className="relative z-10">
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={() => navigate(SCREENS.HOME)} className="w-9 h-9 rounded-full glass-card flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <div>
          <p className="eyebrow text-gray-400">AI Studio</p>
          <h1 className="font-display text-2xl text-gray-900 leading-tight">AI <span className="italic iridescent-text">credits</span></h1>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Iridescent balance card */}
        <div className="iridescent aurora-shimmer rounded-[28px] p-6 text-center border border-white/50 shadow-xl relative overflow-hidden">
          <div className="w-14 h-14 bg-white/25 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <p className="text-white/80 text-xs font-semibold tracking-[0.2em] uppercase">Your Balance</p>
          <p className="text-5xl font-black text-white leading-none mt-1">{user?.credits || 0}</p>
          <p className="text-white/80 text-sm mt-1">credits available</p>
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
        <h2 className="font-display text-xl text-gray-900 pt-1">Top up your <span className="italic iridescent-text">credits</span></h2>
        <div className="space-y-3">
          {CREDIT_PACKAGES.map(pkg => (
            <button key={pkg.credits} disabled={loading}
              className={`w-full text-left glass-floating rounded-[22px] p-4 flex items-center gap-4 hover:scale-[1.02] transition-transform ${pkg.popular ? 'ring-2 ring-pink-300' : ''}`}
              onClick={() => !loading && handleBuy(pkg)}>
              <div className="w-12 h-12 rounded-2xl iridescent flex items-center justify-center border border-white/60 shrink-0">
                {loading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Zap className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{pkg.label}</h3>
                  {pkg.popular && <Badge className="btn-primary-luxury border-0 text-white text-[10px]">BEST</Badge>}
                </div>
                <p className="text-sm text-gray-400">{pkg.credits} AI Credits</p>
              </div>
              <p className="text-lg font-bold text-pink-600 flex items-center shrink-0"><IndianRupee className="w-4 h-4" />{pkg.price}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 pt-1">1 credit = 1 AI decoration design</p>

        {/* Why credits matter */}
        <h2 className="font-display text-xl text-gray-900 pt-3">Why credits <span className="italic iridescent-text">matter</span></h2>
        <div className="space-y-3">
          {WHY_CREDITS.map((w, i) => (
            <div key={i} className="glass-card rounded-[22px] p-4 flex items-start gap-3">
              <div className="w-10 h-10 accent-lavender rounded-xl flex items-center justify-center shrink-0">
                <w.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{w.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{w.desc}</p>
              </div>
              <Check className="w-4 h-4 text-green-500 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)
}
