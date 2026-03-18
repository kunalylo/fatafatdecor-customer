'use client'

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { SCREENS, BUDGET_BRACKETS, api } from '../lib/constants'

export const AppContext = createContext({})
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  // Always start with null/AUTH so server & client render identically (fixes React #418 hydration error).
  // localStorage is read in useEffect after hydration.
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState(SCREENS.AUTH)
  const [prevScreen, setPrevScreen] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [designs, setDesigns] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [slots, setSlots] = useState([])
  const [trackingData, setTrackingData] = useState(null)
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [uploadForm, setUploadForm] = useState({ room_type: 'Dining Room', occasion: 'birthday', description: '', budget: null })
  const [originalImage, setOriginalImage] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlotHour, setSelectedSlotHour] = useState(null)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [signupOtpSent, setSignupOtpSent] = useState(false)
  const [signupOtpValue, setSignupOtpValue] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [userAddress, setUserAddress] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Hydration guard: read localStorage only after client mounts to avoid React #418
  useEffect(() => {
    try {
      const s = localStorage.getItem('fd_user')
      if (s) {
        const parsed = JSON.parse(s)
        setUser(parsed)
        setScreen(SCREENS.HOME)
      }
    } catch {}
    try {
      const loc = localStorage.getItem('fd_location')
      if (loc) setUserAddress(JSON.parse(loc))
    } catch {}
    setMounted(true)
  }, [])

  const navigate = useCallback((s) => {
    setPrevScreen(screen)
    setScreen(s)
  }, [screen])

  const goBack = useCallback(() => {
    if (prevScreen) setScreen(prevScreen)
    else setScreen(SCREENS.HOME)
  }, [prevScreen])

  useEffect(() => {
    if (user) {
      api(`designs?user_id=${user.id}`).then(d => !d.error && setDesigns(d))
      api(`orders?user_id=${user.id}`).then(o => !o.error && setOrders(o))
    }
  }, [user])

  useEffect(() => {
    if (screen === SCREENS.TRACKING && selectedOrder?.id) {
      const poll = setInterval(() => {
        api(`delivery/track/${selectedOrder.id}`).then(d => {
          if (!d.error) setTrackingData(d)
          else if (d.status === 404) clearInterval(poll) // stop polling if order not found
        })
      }, 5000)
      api(`delivery/track/${selectedOrder.id}`).then(d => { if (!d.error) setTrackingData(d) })
      return () => clearInterval(poll)
    }
  }, [screen, selectedOrder])

  const saveAddress = useCallback((addr) => {
    setUserAddress(addr)
    try { if (addr) localStorage.setItem('fd_location', JSON.stringify(addr)); else localStorage.removeItem('fd_location') } catch {}
  }, [])

  const detectLocation = useCallback(async (userId) => {
    if (!navigator.geolocation) return
    setLocationLoading(true)
    setLocationDenied(false)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (userId) api('user/location', { method: 'POST', body: { user_id: userId, lat, lng } })
        try {
          const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsKey}`)
          const geo = await res.json()
          if (geo.status === 'OK' && geo.results?.length) {
            const components = geo.results[0].address_components || []
            const get = (...types) => components.find(c => types.some(t => c.types.includes(t)))?.long_name || ''
            const area = get('sublocality_level_1', 'sublocality_level_2', 'sublocality', 'neighborhood', 'premise')
            const city = get('locality', 'administrative_area_level_3', 'administrative_area_level_2')
            const state = get('administrative_area_level_1')
            const pincode = get('postal_code')
            const formatted = geo.results[0].formatted_address || ''
            const parts = formatted.split(',').map(s => s.trim()).filter(Boolean)
            const fallbackArea = area || parts[parts.length - 4] || ''
            const fallbackCity = city || parts[parts.length - 3] || state || ''
            // Read existing flat/landmark from localStorage to preserve them
            let existingFlat = '', existingLandmark = ''
            try {
              const saved = localStorage.getItem('fd_location')
              if (saved) { const p = JSON.parse(saved); existingFlat = p.flat || ''; existingLandmark = p.landmark || '' }
            } catch {}
            const newAddr = {
              flat: existingFlat,
              landmark: existingLandmark,
              area: fallbackArea,
              city: fallbackCity,
              state,
              pincode,
              lat,
              lng,
              formatted,
            }
            saveAddress(newAddr)
            // Location saved silently — no popup on login
          }
          // else: no results — keep previously saved location unchanged
        } catch {
          // Network error — keep previously saved location if any
        }
        setLocationLoading(false)
      },
      (err) => {
        // Permission denied (1) or unavailable (2) or timeout (3)
        if (err.code === 1) setLocationDenied(true)
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [saveAddress])

  const updateAddressDetails = useCallback((flat, landmark) => {
    setUserAddress(prev => {
      const updated = { ...(prev || {}), flat: flat.trim(), landmark: landmark.trim() }
      try { localStorage.setItem('fd_location', JSON.stringify(updated)) } catch {}
      return updated
    })
    setShowAddressModal(false)
  }, [])

  useEffect(() => {
    if (user) detectLocation(user.id)
  }, [user])

  const handleGoogleAuth = async () => {
    setLoading(true)
    try {
      // Google OAuth via Google Identity Services (GSI)
      if (!window.google) {
        showToast('Google Sign-In not loaded. Please refresh.', 'error')
        setLoading(false); return
      }
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1234567890-placeholder.apps.googleusercontent.com',
        callback: async (response) => {
          // Decode JWT token from Google
          const base64Url = response.credential.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(window.atob(base64))
          const data = await api('auth/google', {
            method: 'POST',
            body: { google_id: payload.sub, email: payload.email, name: payload.name, photo_url: payload.picture }
          })
          if (data.error) { showToast(data.error, 'error'); return }
          setUser(data)
          try { localStorage.setItem('fd_user', JSON.stringify(data)) } catch {}
          showToast(`Welcome, ${data.name}!`, 'success')
          navigate(SCREENS.HOME)
        }
      })
      window.google.accounts.id.prompt()
    } catch (e) { showToast('Google Sign-In failed', 'error') }
    finally { setLoading(false) }
  }

  const handleAuth = async () => {
    setLoading(true)
    try {
      const endpoint = authMode === 'login' ? 'auth/login' : 'auth/register'
      const body = authMode === 'login' ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, phone: authForm.phone, password: authForm.password }
      const data = await api(endpoint, { method: 'POST', body })
      if (data.error) { showToast(data.error, 'error'); return }
      setUser(data)
      try { localStorage.setItem('fd_user', JSON.stringify(data)) } catch {}
      showToast(`Welcome${authMode === 'login' ? ' back' : ''}, ${data.name}!`, 'success')
      navigate(SCREENS.HOME)
    } catch (e) { showToast('Something went wrong', 'error') }
    finally { setLoading(false) }
  }

  const handleSendSignupOtp = async () => {
    if (!authForm.name) { showToast('Enter your full name', 'error'); return }
    const cleanPhone = authForm.phone.replace(/\D/g, '')
    if (!/^\d{10}$/.test(cleanPhone)) { showToast('Enter a valid 10-digit phone number', 'error'); return }
    setLoading(true)
    try {
      const data = await api('auth/send-signup-otp', {
        method: 'POST',
        body: { name: authForm.name, phone: cleanPhone }
      })
      if (data.error) { showToast(data.error, 'error'); return }
      setSignupOtpSent(true)
      setSignupOtpValue('')
      if (data.dev_otp) setDevOtp(data.dev_otp)
      else setDevOtp('')
      showToast('OTP sent to your phone!', 'success')
    } catch (e) {
      showToast('Failed to send OTP. Try again.', 'error')
    }
    finally { setLoading(false) }
  }

  const handleVerifySignupOtp = async () => {
    if (!signupOtpValue || signupOtpValue.trim().length < 6) { showToast('Enter the 6-digit OTP sent to your phone', 'error'); return }
    if (!authForm.email) { showToast('Enter your email', 'error'); return }
    if (!authForm.password) { showToast('Enter a password', 'error'); return }
    setLoading(true)
    try {
      const data = await api('auth/verify-signup-otp', {
        method: 'POST',
        body: { phone: authForm.phone, otp: signupOtpValue.trim(), name: authForm.name, email: authForm.email, password: authForm.password }
      })
      if (data.error) { showToast(data.error, 'error'); return }
      setUser(data)
      try { localStorage.setItem('fd_user', JSON.stringify(data)) } catch {}
      setSignupOtpSent(false)
      setSignupOtpValue('')
      showToast('Account created! Welcome!', 'success')
      navigate(SCREENS.HOME)
    } catch (e) {
      showToast(e.message || 'Verification failed. Try again.', 'error')
    }
    finally { setLoading(false) }
  }

  const handleGenerate = async () => {
    if (!originalImage) { showToast('Please upload or take a photo of your space first!', 'error'); return }
    if (!uploadForm.budget) { showToast('Please select a budget bracket', 'error'); return }
    const budget = BUDGET_BRACKETS.find(b => b.id === uploadForm.budget)
    if (!budget) { showToast('Please select a budget', 'error'); return }
    // Budget is the decoration budget the customer wants — no restrictions
    if (user.credits <= 0) { showToast('No credits! Please purchase credits.', 'error'); navigate(SCREENS.CREDITS); return }
    navigate(SCREENS.GENERATING)
    try {
      const data = await api('designs/generate', {
        method: 'POST',
        body: { user_id: user.id, room_type: uploadForm.room_type, occasion: uploadForm.occasion, description: uploadForm.description, original_image: originalImage, budget_min: budget.min, budget_max: budget.max }
      })
      if (data.error) { showToast(data.error, 'error'); navigate(SCREENS.UPLOAD); return }
      setSelectedDesign(data)
      setUser(prev => ({ ...prev, credits: data.remaining_credits }))
      setDesigns(prev => [data, ...prev])
      navigate(SCREENS.DESIGN)
      showToast('Your space has been decorated!', 'success')
    } catch (e) { showToast('Generation failed. Try again.', 'error'); navigate(SCREENS.UPLOAD) }
  }

  const handleCreateOrder = async (overrideTotal = null) => {
    if (!selectedDesign) return
    // If delivery address not yet completed, send user to address screen first
    if (!userAddress?.flat) {
      showToast('Please add your delivery address first', 'error')
      navigate(SCREENS.ADDRESS)
      return
    }
    setLoading(true)
    try {
      const isLocalDev = process.env.NODE_ENV === 'development'
      if (!isLocalDev) {
        // Use already-detected city from stored address
        const detectedCity = userAddress?.city || null
        if (detectedCity) {
          const cityCheck = await api('city-check', { method: 'POST', body: { city: detectedCity } })
          if (!cityCheck.allowed) {
            showToast('Sorry! We currently serve only: ' + (cityCheck.active_cities?.join(', ') || 'selected cities') + '. You appear to be in ' + detectedCity + '.', 'error')
            setLoading(false); return
          }
        } else {
          // Location not yet detected — ask user to pick city
          const citiesData = await api('cities')
          const cityNames = (citiesData || []).map(c => c.name)
          const userCity = window.prompt('Please enter your city to proceed.\nAvailable cities: ' + cityNames.join(', '))
          if (!userCity) { showToast('City required to place order.', 'error'); setLoading(false); return }
          const cityCheck = await api('city-check', { method: 'POST', body: { city: userCity.trim() } })
          if (!cityCheck.allowed) {
            showToast('Sorry! We currently only serve: ' + (cityCheck.active_cities?.join(', ') || 'selected cities'), 'error')
            setLoading(false); return
          }
        }
      }
      // Build full delivery address for decorator navigation
      const delivery_address = [
        userAddress?.flat,
        userAddress?.area,
        userAddress?.city,
        userAddress?.state,
        userAddress?.pincode
      ].filter(Boolean).join(', ')

      const data = await api('orders', {
        method: 'POST',
        body: {
          user_id: user.id,
          design_id: selectedDesign.id,
          delivery_address: delivery_address || userAddress?.city || '',
          delivery_landmark: userAddress?.landmark || '',
          delivery_lat: userAddress?.lat || null,
          delivery_lng: userAddress?.lng || null,
          // Pass override total if customer removed rentable items from design
          total_override: overrideTotal ? Math.round(overrideTotal) : null
        }
      })
      if (data.error) { showToast(data.error, 'error'); return }
      // Use overrideTotal in local state so BookingScreen shows correct 50% amount
      const finalOrder = overrideTotal ? { ...data, total_cost: Math.round(overrideTotal) } : data
      setSelectedOrder(finalOrder)
      setOrders(prev => [finalOrder, ...prev])
      showToast('Order placed! Now select your delivery date & time.', 'success')
      navigate(SCREENS.BOOKING)
    } catch (e) { showToast('Failed to create order', 'error') }
    finally { setLoading(false) }
  }

  const handlePayment = async (type, amount, orderId = null, creditsCount = 0) => {
    setLoading(true)
    try {
      const orderData = await api('payments/create-order', {
        method: 'POST',
        body: { type, amount, user_id: user.id, order_id: orderId, credits_count: creditsCount }
      })
      if (orderData.error) { showToast(orderData.error, 'error'); setLoading(false); return }
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount, currency: 'INR',
        name: 'FatafatDecor', description: type === 'credits' ? `${creditsCount} AI Credits` : 'Decoration Delivery',
        order_id: orderData.razorpay_order_id,
        handler: async (response) => {
          const verify = await api('payments/verify', { method: 'POST', body: { ...response, payment_id: orderData.payment_id } })
          if (verify.success) {
            showToast('Payment successful!', 'success')
            if (type === 'credits') { setUser(prev => ({ ...prev, credits: (prev.credits || 0) + creditsCount })); navigate(SCREENS.HOME) }
            if (type === 'delivery' && orderId) {
              // Save requested slot to order — decorator will accept and confirm
              const slotDate = selectedDate
              const slotHour = selectedSlotHour
              await api(`orders/${orderId}/request-slot`, { method: 'POST', body: { date: slotDate, hour: slotHour } })
              setSelectedOrder(prev => ({ ...prev, payment_status: 'partial', payment_amount: amount, delivery_status: 'pending', requested_slot: { date: slotDate, hour: slotHour } }))
              showToast('Payment done! Waiting for a decorator to accept your booking.', 'success')
              navigate(SCREENS.TRACKING)
            }
          } else { showToast('Payment verification failed', 'error') }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: '#EC4899' }
      }
      if (window.Razorpay) { new window.Razorpay(options).open() }
      else { showToast('Payment gateway loading...', 'error') }
    } catch (e) { showToast('Payment failed', 'error') }
    finally { setLoading(false) }
  }

  const handleLogout = useCallback(() => {
    setUser(null)
    setDesigns([])
    setOrders([])
    setSelectedDesign(null)
    setSelectedOrder(null)
    setScreen(SCREENS.AUTH)
    try { localStorage.removeItem('fd_user') } catch {}
  }, [])

  const handleBookSlot = async () => {
    if (!selectedOrder || !selectedDate || selectedSlotHour === null) { showToast('Please select date and time', 'error'); return }
    setLoading(true)
    try {
      const data = await api('delivery/book', { method: 'POST', body: { order_id: selectedOrder.id, date: selectedDate, hour: selectedSlotHour } })
      if (data.error) { showToast(data.error, 'error'); return }
      setSelectedOrder(prev => ({ ...prev, delivery_person_id: data.delivery_person.id, delivery_slot: data.slot, delivery_status: 'assigned' }))
      showToast(`Booked! ${data.delivery_person.name} will deliver at ${data.slot.time_label}`, 'success')
    } catch (e) { showToast('Booking failed', 'error') }
    finally { setLoading(false) }
  }

  const loadSlots = async (date) => {
    setSelectedDate(date)
    setSelectedSlotHour(null)
    const data = await api(`delivery/slots?date=${date}`)
    if (!data.error) setSlots(data.slots || [])
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setOriginalImage(ev.target?.result)
      reader.readAsDataURL(file)
    }
  }

  const ctxValue = {
    mounted,
    screen, setScreen, prevScreen, setPrevScreen,
    user, setUser, authMode, setAuthMode,
    loading, setLoading, toast, setToast,
    designs, setDesigns, orders, setOrders,
    selectedDesign, setSelectedDesign, selectedOrder, setSelectedOrder,
    slots, setSlots, trackingData, setTrackingData,
    authForm, setAuthForm, uploadForm, setUploadForm,
    originalImage, setOriginalImage,
    selectedDate, setSelectedDate, selectedSlotHour, setSelectedSlotHour,
    signupOtpSent, setSignupOtpSent, signupOtpValue, setSignupOtpValue,
    devOtp, setDevOtp,
    userAddress, locationLoading, locationDenied, detectLocation, saveAddress,
    showAddressModal, setShowAddressModal, updateAddressDetails,
    mapRef, mapInstance,
    showToast, navigate, goBack,
    handleGoogleAuth, handleAuth, handleSendSignupOtp, handleVerifySignupOtp,
    handleGenerate, handleCreateOrder, handlePayment,
    handleBookSlot, loadSlots, handleFileUpload, handleLogout
  }

  return <AppContext.Provider value={ctxValue}>{children}</AppContext.Provider>
}
