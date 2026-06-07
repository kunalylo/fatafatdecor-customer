'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, CheckCircle2, CreditCard, Clock, Truck, Navigation, Loader2, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function BookingScreen() {
  const {
    selectedOrder, slots, selectedDate, selectedSlotHour, setSelectedSlotHour,
    loading, goBack, navigate, handlePayment, loadSlots, paymentFailed, setPaymentFailed
  } = useApp()
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
          <p className="eyebrow text-gray-400">Schedule</p>
          <h1 className="font-display text-2xl text-gray-900 leading-tight">Book <span className="italic iridescent-text">delivery</span></h1>
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
              <h3 className="font-bold text-sm text-gray-800">Select Time</h3>
            </div>
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
            <p className="text-xs text-gray-400 mb-3">Pay Rs {partialAmount} now. Remaining 50% collected on delivery.</p>
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
            <h3 className="font-bold text-green-600">Delivery Booked!</h3>
            <p className="text-xs text-gray-400 mt-1">{selectedOrder.delivery_slot?.date} at {selectedOrder.delivery_slot?.hour}:00</p>
            <Button onClick={() => navigate(SCREENS.TRACKING)} className="mt-3 btn-primary-luxury border-0 text-white">
              <Navigation className="w-4 h-4 mr-2" /> Track Delivery
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
