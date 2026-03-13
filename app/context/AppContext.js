'use client'

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { SCREENS, BUDGET_BRACKETS, api } from '../lib/constants'
import { auth } from '../firebase'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

export const AppContext = createContext({})
export const useApp = () => useContext(AppContext)

export function AppProvider({ children }) {
  const [screen, setScreen] = useState(SCREENS.AUTH)
  const [prevScreen, setPrevScreen] = useState(null)
  const [user, setUser] = useState(null)
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
  const confirmationResultRef = useRef(null)
  const recaptchaVerifierRef = useRef(null)

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
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

  useEffect(() => {
    if (user && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        api('user/location', { method: 'POST', body: { user_id: user.id, lat: pos.coords.latitude, lng: pos.coords.longitude } })
      }, () => {}, { enableHighAccuracy: true })
    }
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
      showToast(`Welcome${authMode === 'login' ? ' back' : ''}, ${data.name}!`, 'success')
      navigate(SCREENS.HOME)
    } catch (e) { showToast('Something went wrong', 'error') }
    finally { setLoading(false) }
  }

  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      })
    }
    return recaptchaVerifierRef.current
  }

  const handleSendSignupOtp = async () => {
    if (!authForm.name) { showToast('Enter your full name', 'error'); return }
    const cleanPhone = authForm.phone.replace(/\D/g, '')
    if (!/^\d{10}$/.test(cleanPhone)) { showToast('Enter a valid 10-digit phone number', 'error'); return }
    setLoading(true)
    try {
      const verifier = setupRecaptcha()
      const result = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, verifier)
      confirmationResultRef.current = result
      setSignupOtpSent(true)
      setSignupOtpValue('')
      setDevOtp('')
      showToast('OTP sent to your phone!', 'success')
    } catch (e) {
      // Reset recaptcha on error so it can be retried
      recaptchaVerifierRef.current = null
      showToast(e.message?.includes('invalid-phone') ? 'Invalid phone number' : 'Failed to send OTP. Try again.', 'error')
    }
    finally { setLoading(false) }
  }

  const handleVerifySignupOtp = async () => {
    if (!signupOtpValue || signupOtpValue.trim().length < 6) { showToast('Enter the 6-digit OTP sent to your phone', 'error'); return }
    if (!authForm.email) { showToast('Enter your email', 'error'); return }
    if (!authForm.password) { showToast('Enter a password', 'error'); return }
    if (!confirmationResultRef.current) { showToast('Please request OTP first', 'error'); return }
    setLoading(true)
    try {
      // Verify OTP with Firebase
      await confirmationResultRef.current.confirm(signupOtpValue.trim())
      // Firebase verified — now create account in our database
      const data = await api('auth/verify-signup-otp', {
        method: 'POST',
        body: { phone: authForm.phone, otp: signupOtpValue.trim(), name: authForm.name, email: authForm.email, password: authForm.password, firebase_verified: true }
      })
      if (data.error) { showToast(data.error, 'error'); return }
      setUser(data)
      setSignupOtpSent(false)
      setSignupOtpValue('')
      showToast('Account created! Welcome!', 'success')
      navigate(SCREENS.HOME)
    } catch (e) {
      if (e.code === 'auth/invalid-verification-code') showToast('Invalid OTP. Please check and try again.', 'error')
      else if (e.code === 'auth/code-expired') showToast('OTP expired. Please request a new one.', 'error')
      else showToast(e.error || 'Verification failed. Try again.', 'error')
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

  const handleCreateOrder = async () => {
    if (!selectedDesign) return
    setLoading(true)
    try {
      let lat = null, lng = null, detectedCity = null
      const isLocalDev = process.env.NODE_ENV === 'development'
      if (!isLocalDev) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }))
          lat = pos.coords.latitude; lng = pos.coords.longitude
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            const geoData = await geoRes.json()
            detectedCity = geoData?.address?.city || geoData?.address?.town || geoData?.address?.county || null
          } catch (e) {}
        } catch (e) {}
        if (detectedCity) {
          const cityCheck = await api('city-check', { method: 'POST', body: { city: detectedCity } })
          if (!cityCheck.allowed) {
            showToast('Sorry! We currently serve only: ' + (cityCheck.active_cities?.join(', ') || 'selected cities') + '. You appear to be in ' + detectedCity + '.', 'error')
            setLoading(false); return
          }
        } else {
          const citiesData = await api('cities')
          const cityNames = (citiesData || []).map(c => c.name)
          const userCity = window.prompt('Please enter your city to proceed.\nAvailable cities: ' + cityNames.join(', '))
          if (!userCity) { showToast('City required to place order.', 'error'); setLoading(false); return }
          const cityCheck = await api('city-check', { method: 'POST', body: { city: userCity.trim() } })
          if (!cityCheck.allowed) {
            showToast('Sorry! We currently only serve: ' + (cityCheck.active_cities?.join(', ') || 'selected cities'), 'error')
            setLoading(false); return
          }
          detectedCity = userCity.trim()
        }
      }
      const data = await api('orders', {
        method: 'POST',
        body: { user_id: user.id, design_id: selectedDesign.id, delivery_address: detectedCity || '', delivery_lat: lat, delivery_lng: lng }
      })
      if (data.error) { showToast(data.error, 'error'); return }
      setSelectedOrder(data)
      setOrders(prev => [data, ...prev])
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
    mapRef, mapInstance,
    showToast, navigate, goBack,
    handleGoogleAuth, handleAuth, handleSendSignupOtp, handleVerifySignupOtp,
    handleGenerate, handleCreateOrder, handlePayment,
    handleBookSlot, loadSlots, handleFileUpload
  }

  return <AppContext.Provider value={ctxValue}>{children}</AppContext.Provider>
}
