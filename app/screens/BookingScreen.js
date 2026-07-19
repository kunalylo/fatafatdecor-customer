'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft, CheckCircle2, CreditCard, Clock, Navigation, Loader2, AlertCircle,
  PackageCheck, Home as HomeIcon, Calendar, Check, ChevronDown, ChevronUp, Phone
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, SUPPORT_PHONE } from '../lib/constants'

const DECORATORS_BRING = [
  'Required decor material',
  'Balloons and setup items',
  'Tools needed for decoration',
]

const CUSTOMER_PROVIDES = [
  'Room access',
  'Stool / ladder if needed',
  'Electric point (if lights are selected)',
  'Clear area for setup',
]

const FAQS = [
  { q: 'How long does setup take?', a: 'Most decorations are completed within 2 hours of the chosen slot.' },
  { q: 'Will dismantling be done after the event?', a: 'Yes, dismantling is included free with every booking above ₹2,000.' },
  { q: 'Can I change my slot later?', a: 'Yes, you can reschedule once for free up to 12 hours before the slot.' },
  { q: 'Will the decorators clean up?', a: 'A basic surface cleanup is included. Deep cleaning is not part of the package.' },
]

export default function BookingScreen() {
  const {
    selectedOrder, slots, selectedDate, selectedSlotHour, setSelectedSlotHour,
    loading, goBack, navigate, handlePayment, loadSlots, paymentFailed, setPaymentFailed
  } = useApp()
  const [openFaq, setOpenFaq] = useState(null)
  const today = new Date()
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })
  const partialAmount = Math.round((selectedOrder?.total_cost || 0) * 0.5)
  const isPaid = selectedOrder?.payment_status === 'partial' || selectedOrder?.payment_status === 'full'
  // isBooked = slot has actually been confirmed (delivery_slot.date is set + paid)
  const isBooked = !!(selectedOrder?.delivery_slot?.date && isPaid)
  const isSlotSelected = selectedDate && selectedSlotHour !== null

  return (
    <div className="slide-up pb-28 bg-aurora-soft min-h-screen">
      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={goBack} className="w-9 h-9 rounded-full glass-card flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
        <div>
          <p className="eyebrow text-gray-400">Pick your time</p>
          <h1 className="font-display text-2xl text-gray-900 leading-tight">Slot <span className="italic iridescent-text">booking</span></h1>
        </div>
      </div>
      <div className="px-4 space-y-4">

        {/* STEP 1: Select Date */}
        <div className={`glass-floating rounded-[22px] p-4 ${selectedDate ? 'ring-1 ring-green-200' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedDate ? 'bg-green-500' : 'btn-primary-luxury'} text-white`}>
              {selectedDate ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <h3 className="font-bold text-sm text-gray-800">Select Date</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {dates.map(d => {
              const dt = new Date(d)
              return (
                <button key={d} onClick={() => loadSlots(d)}
                  className={`shrink-0 w-16 py-2 rounded-2xl text-center transition-all ${selectedDate === d ? 'btn-primary-luxury text-white' : 'bg-white/60 border border-white/80'}`}>
                  <p className="text-[10px] uppercase">{dt.toLocaleDateString('en', { weekday: 'short' })}</p>
                  <p className="text-lg font-bold">{dt.getDate()}</p>
                  <p className="text-[10px]">{dt.toLocaleDateString('en', { month: 'short' })}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* STEP 2: Select Time (shown after date is picked) */}
        {selectedDate && (
          <div className={`glass-floating rounded-[22px] p-4 ${selectedSlotHour !== null ? 'ring-1 ring-green-200' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selectedSlotHour !== null ? 'bg-green-500' : 'btn-primary-luxury'} text-white`}>
                {selectedSlotHour !== null ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <h3 className="font-bold text-sm text-gray-800">Choose Your Decoration Slot</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">Pick any window that works for you.</p>
            <div className="grid grid-cols-3 gap-2">
              {slots.map(s => (
                <button key={s.hour} onClick={() => s.available && setSelectedSlotHour(s.hour)} disabled={!s.available}
                  className={`py-2 px-1 rounded-2xl text-center transition-all ${selectedSlotHour === s.hour ? 'btn-primary-luxury text-white' : s.available ? 'bg-white/60 border border-white/80 hover:border-pink-300' : 'bg-red-50 opacity-40 border border-red-100'}`}>
                  <Clock className="w-3 h-3 mx-auto mb-0.5" />
                  <p className="text-[10px] font-semibold">{s.time_label}</p>
                  <p className={`text-[8px] ${s.available ? 'text-green-500' : 'text-red-400'}`}>
                    {s.admin_blocked ? 'Packed' : s.available ? `${s.available_count} free` : 'Full'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Payment (shown after date + time selected, before paid) */}
        {isSlotSelected && !isBooked && (
          <div className={`glass-floating rounded-[22px] p-4 ${isPaid ? 'ring-1 ring-green-200' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isPaid ? 'bg-green-500' : 'btn-primary-luxury'} text-white`}>
                {isPaid ? <CheckCircle2 className="w-4 h-4" /> : '3'}
              </div>
              <h3 className="font-bold text-sm text-gray-800">Advance Payment (50%)</h3>
            </div>
            <p className="text-xs text-gray-400 mb-1">
              Slot: <span className="font-semibold text-pink-500">{selectedDate} at {selectedSlotHour}:00 – {selectedSlotHour + 1}:00</span>
            </p>
            <p className="text-xs text-gray-400 mb-3">Pay ₹{partialAmount} now. Remaining 50% collected after setup.</p>
            {/* Payment failure retry banner (Fix 4) */}
            {paymentFailed && !isPaid && (
              <div className="mb-3 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-600">Payment was not completed</p>
                  <p className="text-xs text-red-400 mt-0.5">Your order is saved. Tap below to try again.</p>
                </div>
              </div>
            )}
            {!isPaid ? (
              <Button onClick={() => { if (partialAmount <= 0) return; setPaymentFailed(false); handlePayment('delivery', partialAmount, selectedOrder?.id) }}
                disabled={loading || partialAmount <= 0} className="w-full h-11 btn-primary-luxury border-0 text-white font-bold rounded-2xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4 mr-2" />{partialAmount <= 0 ? 'Order total unavailable — go back' : (paymentFailed ? 'Retry Payment' : `Pay ₹${partialAmount} & Confirm Slot`)}</>}
              </Button>
            ) : (
              <Badge className="bg-green-100 text-green-600 border-green-200">Payment Done</Badge>
            )}
          </div>
        )}

        {/* Booking Confirmed */}
        {isBooked && (
          <div className="glass-floating rounded-[22px] p-4 text-center ring-1 ring-green-200">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <h3 className="font-bold text-green-600">Slot Confirmed!</h3>
            <p className="text-xs text-gray-400 mt-1">{selectedOrder.delivery_slot?.date} at {selectedOrder.delivery_slot?.hour}:00</p>
            <Button onClick={() => navigate(SCREENS.TRACKING)} className="mt-3 btn-primary-luxury border-0 text-white">
              <Navigation className="w-4 h-4 mr-2" /> Track Setup
            </Button>
          </div>
        )}

        {/* What decorators will bring */}
        <div className="glass-floating rounded-[22px] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl accent-mint flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="eyebrow text-gray-400">Included</p>
              <h3 className="font-bold text-sm text-gray-800">What decorators will bring</h3>
            </div>
          </div>
          <div className="space-y-2.5">
            {DECORATORS_BRING.map(item => (
              <div key={item} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-700" />
                </div>
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What you should provide */}
        <div className="glass-floating rounded-[22px] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl accent-peach flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="eyebrow text-gray-400">Your side</p>
              <h3 className="font-bold text-sm text-gray-800">What you should provide</h3>
            </div>
          </div>
          <div className="space-y-2.5">
            {CUSTOMER_PROVIDES.map(item => (
              <div key={item} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-pink-700" />
                </div>
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expected completion */}
        <div className="glass-floating rounded-[22px] p-4 flex items-start gap-3">
          <Clock className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
          <div>
            <p className="eyebrow text-pink-500 mb-1">Expected completion time</p>
            <p className="text-sm text-gray-700 leading-relaxed">We endeavour to complete most decorations within 2 hours.</p>
          </div>
        </div>

        {/* Exclusions */}
        <div className="rounded-[22px] p-4 bg-white/55 border border-white/60 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="eyebrow text-amber-600 mb-1">Exclusions</p>
            <p className="text-sm text-gray-700 leading-relaxed">Deep cleaning is not included. Basic surface cleanup will be done.</p>
          </div>
        </div>

        {/* Cancellation policy */}
        <div className="glass-floating rounded-[22px] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl accent-lavender flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="eyebrow text-gray-400">Flexible</p>
              <h3 className="font-bold text-sm text-gray-800">Cancellation policy</h3>
            </div>
          </div>
          <div className="space-y-1.5 text-sm text-gray-700">
            <p>· Free cancellation more than 12 hours before service.</p>
            <p>· Within 12 hours, cancellation charges may apply.</p>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <p className="eyebrow text-gray-500 mb-2">Frequently asked</p>
          <div className="space-y-2">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i
              return (
                <button key={i} onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full glass-floating rounded-[20px] p-4 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-gray-800 flex-1">{f.q}</p>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  </div>
                  {isOpen && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{f.a}</p>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Help footer */}
        <a href={`tel:${SUPPORT_PHONE}`} className="w-full glass-floating rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl accent-mint flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-800">Need help with your slot?</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Talk to support</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-pink-500 tracking-widest uppercase">Call</span>
        </a>
      </div>
    </div>
  )
}
