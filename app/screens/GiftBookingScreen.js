'use client'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'
import { ArrowLeft, Calendar, Clock, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GiftBookingScreen() {
  const { selectedGiftOrder, handleGiftPayment, navigate, goBack, loading } = useApp()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedHour, setSelectedHour] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!selectedGiftOrder) { navigate(SCREENS.HOME); return }
  }, [])

  const loadSlots = async (date) => {
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/delivery/slots?date=${date}`)
      const data = await res.json()
      if (data.slots) setSlots(data.slots)
    } catch {}
    setLoadingSlots(false)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date); setSelectedHour(null); loadSlots(date)
  }

  const handleTimeSelect = (hour) => { setSelectedHour(hour) }

  const handlePay = () => {
    if (!selectedGiftOrder || selectedHour === null) return
    handleGiftPayment(selectedGiftOrder.gift_total, selectedGiftOrder.id, selectedDate, selectedHour)
  }

  if (!selectedGiftOrder) return null

  const formatDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Book Gift Delivery</h1>
            <p className="text-xs text-gray-400">{selectedGiftOrder.gift_items?.length} item{selectedGiftOrder.gift_items?.length > 1 ? 's' : ''} · ₹{selectedGiftOrder.gift_total?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Gift summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-pink-500" />
            <p className="font-bold text-sm text-gray-700">Your Gifts</p>
          </div>
          {selectedGiftOrder.gift_items?.map((g, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{g.quantity}× {g.name}</span>
              <span className="font-semibold text-gray-800">₹{(g.price * g.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-pink-600">₹{selectedGiftOrder.gift_total?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Step 1: Date */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-pink-500" />
            <p className="font-bold text-sm text-gray-700">Select Delivery Date</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {dates.map(d => (
              <button key={d} onClick={() => handleDateSelect(d)}
                className={`py-2 rounded-xl text-xs font-semibold transition-colors ${selectedDate === d ? 'bg-pink-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-pink-50'}`}>
                {formatDate(d).split(' ')[0]}<br />{formatDate(d).split(' ').slice(1).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Time */}
        {selectedDate && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-pink-500" />
              <p className="font-bold text-sm text-gray-700">Select Delivery Time</p>
            </div>
            {loadingSlots ? (
              <div className="text-center py-4 text-gray-400 text-sm">Loading slots...</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.filter(s => s.available).map(s => (
                  <button key={s.hour} onClick={() => handleTimeSelect(s.hour)}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${selectedHour === s.hour ? 'bg-pink-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-pink-50'}`}>
                    {s.time_label}
                  </button>
                ))}
                {slots.filter(s => s.available).length === 0 && (
                  <p className="col-span-3 text-center text-sm text-gray-400 py-2">No slots available for this date</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pay */}
        {selectedDate && selectedHour !== null && (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100">
            <p className="font-bold text-gray-800 mb-1">Ready to pay!</p>
            <p className="text-sm text-gray-500 mb-4">
              Delivery on {formatDate(selectedDate)} at {selectedHour}:00 – {selectedHour + 1}:00
            </p>
            <Button onClick={handlePay} disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-2xl text-base">
              {loading ? 'Processing...' : `Pay 100% · ₹${selectedGiftOrder.gift_total?.toLocaleString('en-IN')}`}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">Full payment required for gift delivery</p>
          </div>
        )}
      </div>
    </div>
  )
}
