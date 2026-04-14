'use client'

const IK = 'https://ik.imagekit.io/jcp2urr7b'
export const LOGO_URL  = `${IK}/branding/logo.png?v=3`
export const ICON_URL  = `${IK}/branding/icon-512.png?v=3`

export const SCREENS = {
  AUTH: 'auth', HOME: 'home', UPLOAD: 'upload', GENERATING: 'generating',
  DESIGN: 'design', BOOKING: 'booking', TRACKING: 'tracking', CREDITS: 'credits',
  ORDERS: 'orders', PROFILE: 'profile', ORDER_DETAIL: 'order_detail', ADDRESS: 'address',
  GIFTS: 'gifts', GIFT_BOOKING: 'gift_booking',
}

export const ROOM_TYPES = ['Dining Room', 'Living Room', 'Bedroom', 'Balcony', 'Garden', 'Hall', 'Office', 'Terrace']

export const OCCASIONS = ['birthday', 'anniversary', 'wedding', 'dinner', 'party', 'baby_shower', 'engagement', 'corporate', 'festival', 'housewarming']

export const BUDGET_BRACKETS = [
  { id: 'budget_1', label: 'Rs 3,000 - 5,000', min: 3000, max: 5000 },
  { id: 'budget_2', label: 'Rs 5,000 - 10,000', min: 5000, max: 10000 },
  { id: 'budget_3', label: 'Rs 10,000 - 15,000', min: 10000, max: 15000 },
  { id: 'budget_4', label: 'Rs 15,000 - 20,000', min: 15000, max: 20000 },
  { id: 'budget_5', label: 'Rs 20,000 - 30,000', min: 20000, max: 30000 },
  { id: 'budget_6', label: 'Rs 30,000 - 50,000', min: 30000, max: 50000 }
]

export const CREDIT_PACKAGES = [
  { credits: 1, price: 150, label: 'Single Credit' },
  { credits: 5, price: 590, label: '5 Credits', popular: true },
  { credits: 10, price: 950, label: '10 Credits' }
]

export const SUPPORT_PHONE = '6204711205'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Endpoints where a 401 should NOT trigger auto-logout (user is logging in)
const AUTH_PATHS = new Set([
  'auth/login', 'auth/register', 'auth/send-login-otp', 'auth/verify-login-otp',
  'auth/send-signup-otp', 'auth/verify-signup-otp', 'auth/google',
  'auth/forgot-otp', 'auth/reset-password',
])

export const api = async (path, opts = {}) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fd_token') : null
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const url = API_BASE ? `${API_BASE}/api/${path}` : `/api/${path}`
    const res = await fetch(url, {
      ...opts,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    })
    // 401 on non-auth endpoint → token expired / invalid → force logout
    if (res.status === 401 && !AUTH_PATHS.has(path) && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('fd_token')
        localStorage.removeItem('fd_user')
        window.dispatchEvent(new CustomEvent('fd:auth-expired'))
      } catch {}
    }
    // Safely parse response — proxies / load-balancers can return non-JSON
    const text = await res.text()
    try {
      return text ? JSON.parse(text) : {}
    } catch {
      return { error: `Unexpected server response (${res.status})` }
    }
  } catch (e) {
    console.error(`API error [${path}]:`, e.message)
    return { error: 'Network error. Please check your connection.' }
  }
}
