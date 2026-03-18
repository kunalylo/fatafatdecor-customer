'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, MapPin, Navigation, Home, Briefcase, MoreHorizontal, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const ADDRESS_TYPES = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
]

const DEFAULT_LAT = 18.5204   // Pune fallback
const DEFAULT_LNG = 73.8567

export default function AddressScreen() {
  const { goBack, userAddress, saveAddress, showToast } = useApp()

  const [step, setStep] = useState(1)  // 1 = map, 2 = details

  // Map centre — seed from previously detected coords or default city
  const [mapLat, setMapLat] = useState(userAddress?.lat || DEFAULT_LAT)
  const [mapLng, setMapLng] = useState(userAddress?.lng || DEFAULT_LNG)

  // Reverse-geocoded fields
  const [geocoding, setGeocoding] = useState(false)
  const [detectedFormatted, setDetectedFormatted] = useState(userAddress?.formatted || '')
  const [detectedArea, setDetectedArea]   = useState(userAddress?.area    || '')
  const [detectedCity, setDetectedCity]   = useState(userAddress?.city    || '')
  const [detectedState, setDetectedState] = useState(userAddress?.state   || '')
  const [detectedPincode, setDetectedPincode] = useState(userAddress?.pincode || '')

  // Detail-step fields
  const [flatInput,     setFlatInput]     = useState(userAddress?.flat     || '')
  const [landmarkInput, setLandmarkInput] = useState(userAddress?.landmark || '')
  const [addressType,   setAddressType]   = useState(userAddress?.type     || 'home')

  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const geocodeTimer = useRef(null)
  const latestCenter = useRef({ lat: mapLat, lng: mapLng })
  const lastGeocoded = useRef({ lat: null, lng: null })  // track last geocoded coords

  // ─── Reverse geocode helper ───────────────────────────────────────────────
  const reverseGeocode = useCallback((lat, lng) => {
    // Skip if coords haven't moved more than ~10m since last successful geocode
    if (lastGeocoded.current.lat !== null) {
      const dlat = Math.abs(lat - lastGeocoded.current.lat)
      const dlng = Math.abs(lng - lastGeocoded.current.lng)
      if (dlat < 0.0001 && dlng < 0.0001) return
    }
    clearTimeout(geocodeTimer.current)
    setGeocoding(true)
    geocodeTimer.current = setTimeout(async () => {
      try {
        const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
        )
        const geo = await res.json()
        if (geo.status === 'OK' && geo.results?.length) {
          const comps = geo.results[0].address_components || []
          const get = (...types) =>
            comps.find(c => types.some(t => c.types.includes(t)))?.long_name || ''
          const area    = get('sublocality_level_1','sublocality_level_2','sublocality','neighborhood')
          const city    = get('locality','administrative_area_level_3','administrative_area_level_2')
          const state   = get('administrative_area_level_1')
          const pincode = get('postal_code')
          const formatted = geo.results[0].formatted_address || ''
          const parts = formatted.split(',').map(s => s.trim()).filter(Boolean)
          setDetectedArea(area   || parts[parts.length - 4] || '')
          setDetectedCity(city   || parts[parts.length - 3] || state || '')
          setDetectedState(state)
          setDetectedPincode(pincode)
          setDetectedFormatted(formatted)
          lastGeocoded.current = { lat, lng }  // mark as done — skip repeat idle events
        }
      } catch {}
      setGeocoding(false)
    }, 600)
  }, [])

  // ─── Init Google Map ──────────────────────────────────────────────────────
  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return
    if (!window.google?.maps) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: latestCenter.current.lat, lng: latestCenter.current.lng },
      zoom: 17,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    })

    // addListenerOnce: fires exactly once when map first finishes loading.
    // Prevents repeated idle events (tile loads) from canceling the geocode timer.
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      const c = map.getCenter()
      latestCenter.current = { lat: c.lat(), lng: c.lng() }
      setMapLat(c.lat())
      setMapLng(c.lng())
      reverseGeocode(c.lat(), c.lng())
    })

    // dragend: geocode when user stops dragging the map
    window.google.maps.event.addListener(map, 'dragend', () => {
      const c = map.getCenter()
      latestCenter.current = { lat: c.lat(), lng: c.lng() }
      setMapLat(c.lat())
      setMapLng(c.lng())
      lastGeocoded.current = { lat: null, lng: null }  // force fresh geocode on drag
      reverseGeocode(c.lat(), c.lng())
    })

    mapInstance.current = map
  }, [reverseGeocode])

  useEffect(() => {
    if (step !== 1) return
    if (typeof window === 'undefined') return

    let poll = null

    const cleanup = () => {
      clearTimeout(geocodeTimer.current)
      if (poll) { clearInterval(poll); poll = null }
      if (mapInstance.current) {
        window.google?.maps?.event?.clearInstanceListeners(mapInstance.current)
        mapInstance.current = null
      }
    }

    if (window.google?.maps) {
      initMap()
    } else {
      poll = setInterval(() => {
        if (window.google?.maps) { clearInterval(poll); poll = null; initMap() }
      }, 100)
    }

    return cleanup
  }, [step, initMap])

  // ─── Use GPS current position ─────────────────────────────────────────────
  const goToCurrentLocation = () => {
    if (!navigator.geolocation) return
    setGeocoding(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        latestCenter.current = { lat, lng }
        lastGeocoded.current = { lat: null, lng: null }  // force re-geocode new GPS position
        setMapLat(lat); setMapLng(lng)
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat, lng })
          mapInstance.current.setZoom(17)
        }
        reverseGeocode(lat, lng)
      },
      () => setGeocoding(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // ─── Confirm map location → go to step 2 ──────────────────────────────────
  const confirmLocation = () => {
    saveAddress({
      ...(userAddress || {}),
      area:      detectedArea,
      city:      detectedCity,
      state:     detectedState,
      pincode:   detectedPincode,
      lat:       latestCenter.current.lat,
      lng:       latestCenter.current.lng,
      formatted: detectedFormatted,
    })
    setStep(2)
  }

  // ─── Save final address ───────────────────────────────────────────────────
  const handleSave = () => {
    if (!flatInput.trim()) {
      showToast('Please enter flat / house number', 'error')
      return
    }
    const updated = {
      flat:      flatInput.trim(),
      landmark:  landmarkInput.trim(),
      type:      addressType,
      area:      detectedArea,
      city:      detectedCity,
      state:     detectedState,
      pincode:   detectedPincode,
      lat:       latestCenter.current.lat,
      lng:       latestCenter.current.lng,
      formatted: detectedFormatted,
    }
    saveAddress(updated)
    showToast('Address saved!', 'success')
    goBack()   // returns to Design screen if came from Place Order, or Home if came from location bar
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — MAP
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm z-20 shrink-0">
          <button
            onClick={goBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 text-base leading-tight">Set Delivery Location</h1>
            <p className="text-gray-400 text-xs">Drag the map to pin your exact spot</p>
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-0">
          <div ref={mapRef} className="absolute inset-0" />

          {/* Fixed centre pin */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div style={{ marginBottom: '28px' }} className="flex flex-col items-center">
              <div className="w-12 h-12 gradient-pink rounded-full flex items-center justify-center shadow-xl shadow-pink-400/40">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              {/* pin shadow */}
              <div className="w-4 h-2 bg-black/15 rounded-full blur-[2px] -mt-1" />
            </div>
          </div>

          {/* GPS button */}
          <button
            onClick={goToCurrentLocation}
            className="absolute bottom-52 right-4 z-20 bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center border border-gray-100 active:scale-95 transition-transform"
          >
            <Navigation className="w-5 h-5 text-pink-500" />
          </button>
        </div>

        {/* Bottom card */}
        <div className="bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-10 shrink-0 z-20">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-2">DELIVERING TO</p>
          <div className="flex items-start gap-3 mb-5">
            <MapPin className="w-5 h-5 text-pink-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {geocoding ? (
                <span className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Finding your location…
                </span>
              ) : (
                <>
                  <p className="font-bold text-gray-800 text-sm leading-snug truncate">
                    {detectedArea || detectedCity || 'Move map to detect address'}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">
                    {[detectedCity, detectedState, detectedPincode].filter(Boolean).join(', ')}
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={confirmLocation}
            disabled={geocoding || !detectedCity}
            className="w-full gradient-pink text-white font-bold py-4 rounded-2xl text-sm shadow-pink disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
          >
            Confirm Location
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — HOUSE DETAILS
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm shrink-0">
        <button onClick={() => setStep(1)} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="font-bold text-gray-800 text-base leading-tight">Enter Complete Address</h1>
          <p className="text-gray-400 text-xs">Help the decorator find you easily</p>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">

        {/* Confirmed location chip */}
        <div className="flex items-start gap-3 bg-pink-50 border border-pink-100 rounded-2xl p-4 mb-5">
          <div className="w-10 h-10 gradient-pink rounded-full flex items-center justify-center shrink-0 shadow-pink">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm leading-tight truncate">
              {detectedArea || detectedCity}
            </p>
            <p className="text-gray-400 text-xs mt-0.5 truncate">
              {[detectedCity, detectedState, detectedPincode].filter(Boolean).join(', ')}
            </p>
          </div>
          <button
            onClick={() => setStep(1)}
            className="text-pink-500 text-xs font-bold shrink-0 px-1"
          >
            Change
          </button>
        </div>

        {/* House / Flat */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            House / Flat / Block No. <span className="text-pink-500">*</span>
          </label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-pink-400 transition-colors bg-white">
            <Home className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={flatInput}
              onChange={e => setFlatInput(e.target.value)}
              placeholder="e.g. Flat 204, Sunrise Apartments"
              className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder-gray-300"
              autoFocus
            />
          </div>
        </div>

        {/* Landmark */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            Landmark <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-pink-400 transition-colors bg-white">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={landmarkInput}
              onChange={e => setLandmarkInput(e.target.value)}
              placeholder="e.g. Near City Mall, Opp. HDFC Bank"
              className="flex-1 text-sm text-gray-800 outline-none bg-transparent placeholder-gray-300"
            />
          </div>
        </div>

        {/* Save as */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-600 mb-2 block">Save as</label>
          <div className="flex gap-2">
            {ADDRESS_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setAddressType(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs font-semibold transition-all ${
                  addressType === t.id
                    ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Full address preview */}
        {flatInput.trim() && (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs leading-relaxed">
            <p className="font-bold text-gray-500 text-[10px] uppercase tracking-widest mb-1.5">
              🗺️ Decorator will navigate to
            </p>
            <p className="text-gray-700 font-medium">
              {[flatInput.trim(), detectedArea, detectedCity, detectedState, detectedPincode]
                .filter(Boolean).join(', ')}
            </p>
            {landmarkInput.trim() && (
              <p className="mt-1 text-pink-500 font-semibold">📍 Near: {landmarkInput.trim()}</p>
            )}
          </div>
        )}
      </div>

      {/* Sticky save button */}
      <div className="px-5 pb-10 pt-3 bg-white border-t border-gray-100 shrink-0">
        <button
          onClick={handleSave}
          disabled={!flatInput.trim()}
          className="w-full gradient-pink text-white font-bold py-4 rounded-2xl text-sm shadow-pink disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          Save Address
        </button>
      </div>
    </div>
  )
}
