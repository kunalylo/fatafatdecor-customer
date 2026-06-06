'use client'
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { SCREENS, api } from '../lib/constants'
import { ArrowLeft, Calendar, Clock, Package, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GiftBookingScreen() {
  const { selectedGiftOrder, handleGiftPayment, navigate, goBack, loading, showToast } = useApp()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedHour, setSelectedHour] = useState(null)
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [giftMessage, setGiftMessage] = useState(selectedGiftOrder?.gift_message || '')
  const [deliveryMode, setDeliveryMode] = useState('scheduled')  // 'instant' | 'scheduled'

  // Include today + next 6 days (gifts can be ordered same-day)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!selectedGiftOrder) { navigate(SCREENS.HOME); return }
  }, [])

  const loadSlots = async (date) => {
    setLoadingSlots(true)
    try {
      const data = await api(`delivery/slots?date=${date}`)
      if (data.error) { showToast('Could not load time slots', 'error'); setSlots([]) }
      else if (data.slots) setSlots(data.slots)
      else setSlots([])
    } catch { showToast('Failed to load slots', 'error'); setSlots([]) }
    setLoadingSlots(false)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date); setSelectedHour(null); loadSlots(date)
  }

  const handleTimeSelect = (hour) => { setSelectedHour(hour) }

  const handlePay = () => {
    if (!selectedGiftOrder || !selectedDate || selectedHour === null) return
    handleGiftPayment(selectedGiftOrder.gift_total, selectedGiftOrder.id, selectedDate, selectedHour, giftMessage, 'scheduled')
  }

  const handleInstantPay = () => {
    if (!selectedGiftOrder) return
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    handleGiftPayment(selectedGiftOrder.gift_total, selectedGiftOrder.id, date, now.getHours(), giftMessage, 'instant')
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
            <p className="text-xs text-gray-400">{selectedGiftOrder.gift_items?.length} item{selectedGiftOrder.gift_items?.length > 1 ? 's' : ''} · Rs {selectedGiftOrder.gift_total?.toLocaleString('en-IN')}</p>
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
              <span className="text-gray-600">{g.quantity}x {g.name}</span>
              <span className="font-semibold text-gray-800">Rs {(g.price * g.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-pink-600">Rs {selectedGiftOrder.gift_total?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Gift Message */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">💌</span>
            <p className="font-bold text-sm text-gray-700">Gift Message <span className="font-normal text-gray-400">(optional)</span></p>
          </div>
          <textarea
            value={giftMessage}
            onChange={e => setGiftMessage(e.target.value)}
            placeholder="Add a personal message for the recipient..."
            maxLength={200}
            className="w-full h-20 rounded-xl border border-gray-200 p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-pink-300 placeholder-gray-300"
          />
          <p className="text-right text-[10px] text-gray-300 mt-1">{giftMessage.length}/200</p>
        </div>

        {/* Delivery mode: Instant vs Scheduled */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="font-bold text-sm text-gray-700 mb-3">When should it arrive?</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setDeliveryMode('instant')}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${deliveryMode === 'instant' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 bg-gray-50'}`}>
              <p className="text-sm font-bold text-gray-800">⚡ Instant</p>
              <p className="text-[11px] text-gray-500">Within 3 hours</p>
            </button>
            <button onClick={() => setDeliveryMode('scheduled')}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${deliveryMode === 'scheduled' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 bg-gray-50'}`}>
              <p className="text-sm font-bold text-gray-800">📅 Schedule</p>
              <p className="text-[11px] text-gray-500">Pick a date &amp; time</p>
            </button>
          </div>
        </div>

        {deliveryMode === 'instant' ? (
          /* Instant: pay now, reaches within 3 hours */
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 border border-pink-100">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-pink-500" />
              <p className="font-bold text-gray-800">Instant Delivery</p>
            </div>
            <p className="text-sm text-gray-500 mb-4">🚚 Your gift will reach you within the next <strong>3 hours</strong>.</p>
            <Button onClick={handleInstantPay} disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-2xl text-base">
              {loading ? 'Processing...' : `Pay 100% · Rs ${selectedGiftOrder.gift_total?.toLocaleString('en-IN')}`}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">Full payment required for gift delivery</p>
          </div>
        ) : (
          <>
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
                  Delivery on {formatDate(selectedDate)} at {selectedHour}:00 - {selectedHour + 1}:00
                </p>
                <Button onClick={handlePay} disabled={loading}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-2xl text-base">
                  {loading ? 'Processing...' : `Pay 100% · Rs ${selectedGiftOrder.gift_total?.toLocaleString('en-IN')}`}
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">Full payment required for gift delivery</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
