// ============================================================
// FatafatDecor API - Customer App Route Handler
// ============================================================
//
// TABLE OF CONTENTS:
//   1.  SETUP & HELPERS         - DB connection, CORS, utilities
//   2.  AUTH EMAIL              - POST /auth/register, POST /auth/login
//                                 POST /auth/send-signup-otp
//                                 POST /auth/verify-signup-otp
//   3.  AUTH GOOGLE             - POST /auth/google
//   4.  CITIES MANAGEMENT       - GET/POST /cities, PUT/DELETE /cities/:id, POST /city-check
//   5.  ITEMS                   - GET/POST /items, PUT/DELETE /items/:id
//   6.  RENT ITEMS              - GET /rent-items
//   7.  KITS                    - GET/POST /kits, PUT/DELETE /kits/:id
//                                 GET /kits/match, POST /kits/analyze
//                                 GET/POST /kits/reference-images, DELETE /kits/reference-images/:id
//   8.  DESIGNS                 - POST /designs/generate, GET /designs, GET /designs/:id
//   9.  ORDERS                  - POST /orders, GET /orders, GET /orders/:id
//  10.  PAYMENTS                - POST /payments/create-order, POST /payments/verify
//  11.  DELIVERY SLOTS          - GET /delivery/slots, POST /delivery/book
//                                 POST /delivery/update-location, GET /delivery/track/:id
//                                 POST /delivery/status
//  12.  CREDITS                 - GET /credits/:userId
//  13.  DELIVERY PERSONS        - GET/POST /delivery-persons, PUT /delivery-persons/:id
//  14.  USER LOCATION           - POST /user/location
//  15.  IMAGEKIT                - GET /imagekit/reference, POST /imagekit/upload
//  16.  SEED                    - GET/POST /seed
// ============================================================

import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { signToken, getUserIdFromRequest } from '../../lib/jwt'

let client, db

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001'
const IMAGEKIT_URL = process.env.NEXT_PUBLIC_IMAGEKIT_URL || 'https://ik.imagekit.io/jcp2urr7b'

function getImageKitFolder(budget_min, budget_max) {
  const avg = (Number(budget_min) + Number(budget_max)) / 2
  if (avg <= 5000)  return 'dataset/3k to 5k'
  if (avg <= 10000) return 'dataset/5k to 10k'
  if (avg <= 20000) return 'dataset/20k to 30k'   // no 10-20k folder — use next tier
  if (avg <= 30000) return 'dataset/20k to 30k'
  if (avg <= 50000) return 'dataset/30k to 50k'
  return 'dataset/50,000 and above'
}

async function connectToMongo() {
  if (client && db) return db
  try {
    const mongoUrl = process.env.MONGO_URL
    if (!mongoUrl) throw new Error('MONGO_URL not set in .env.local')
    client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 })
    await client.connect()
    db = client.db(process.env.DB_NAME || 'fatafatdecor')
    return db
  } catch (e) {
    client = null; db = null
    throw new Error('MongoDB connection failed: ' + e.message)
  }
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}

// ---- 2Factor.in helper (OTP only) ----
async function sendOtpSms(phone, otp) {
  const key = process.env.TWO_FACTOR_API_KEY
  if (!key) return false
  try {
    const cleanPhone = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10)
    if (cleanPhone.length !== 10) return false
    const res = await fetch(`https://2factor.in/API/V1/${key}/SMS/${cleanPhone}/${otp}/OTP1`)
    const data = await res.json()
    return data.Status === 'Success'
  } catch (e) {
    console.error('2Factor OTP error:', e.message)
    return false
  }
}

// ---- WhatsApp Cloud API (Meta) — order notifications ----
async function sendWhatsApp(phone, message) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !accessToken) {
    console.log('[WhatsApp] env vars not set — skipping notification')
    return
  }
  try {
    const cleanPhone = String(phone).replace(/\D/g, '').replace(/^91/, '').slice(-10)
    if (cleanPhone.length !== 10) return
    const waPhone = '91' + cleanPhone   // e.g. 919876543210
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: waPhone,
          type: 'text',
          text: { body: message }
        })
      }
    )
    const data = await res.json()
    if (!res.ok) console.error('WhatsApp API error:', JSON.stringify(data))
  } catch (e) {
    console.error('WhatsApp send error:', e.message)
  }
}

function ok(data) { return cors(NextResponse.json(data)) }
function err(msg, status = 400) { return cors(NextResponse.json({ error: msg }, { status })) }
function hashPwd(pwd) { return crypto.createHash('sha256').update(pwd).digest('hex') }
function hashOtp(otp) { return crypto.createHash('sha256').update(`signup:${otp}`).digest('hex') }

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }))
}

// Regional language → English city name aliases
const CITY_ALIASES = {
  'पुणे': 'Pune', 'पुना': 'Pune',
  'रांची': 'Ranchi', 'राँची': 'Ranchi',
  'मुंबई': 'Mumbai', 'बॉम्बे': 'Mumbai',
  'दिल्ली': 'Delhi', 'नई दिल्ली': 'Delhi', 'नयी दिल्ली': 'Delhi',
  'बेंगलुरु': 'Bangalore', 'बेंगलूरु': 'Bangalore', 'बैंगलोर': 'Bangalore',
  'हैदराबाद': 'Hyderabad', 'चेन्नई': 'Chennai', 'कोलकाता': 'Kolkata',
  'जयपुर': 'Jaipur', 'अहमदाबाद': 'Ahmedabad', 'सूरत': 'Surat',
  'नागपुर': 'Nagpur', 'इंदौर': 'Indore', 'भोपाल': 'Bhopal',
  'लखनऊ': 'Lucknow', 'पटना': 'Patna', 'गुरुग्राम': 'Gurugram',
  'गुड़गांव': 'Gurugram', 'नोएडा': 'Noida', 'कानपुर': 'Kanpur',
  'नाशिक': 'Nashik', 'औरंगाबाद': 'Aurangabad', 'कोल्हापूर': 'Kolhapur',
  'Pune': 'Pune', 'pune': 'Pune',
}
function normalizeCityName(city) {
  if (!city) return city
  const trimmed = city.trim()
  return CITY_ALIASES[trimmed] || trimmed
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
async function isCityAllowed(db, city) {
  if (!city) return false
  const normalized = normalizeCityName(city)
  const cityDoc = await db.collection('allowed_cities').findOne({
    name: { $regex: new RegExp('^' + escapeRegex(normalized) + '$', 'i') },
    active: true
  })
  return !!cityDoc
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const method = request.method
  try {
    const db = await connectToMongo()

    if ((path.length === 0 || (path.length === 1 && (path[0] === 'root' || path[0] === ''))) && method === 'GET') {
      return ok({ message: 'FatafatDecor API v2.0', status: 'running' })
    }

    // ====== AUTH EMAIL ======
    if (path[0] === 'auth' && path[1] === 'register' && method === 'POST') {
      const body = await request.json()
      const { name, email, phone, password, role } = body
      if (!name || !email || !password) return err('Name, email, password required')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Invalid email format')
      if (password.length < 6) return err('Password must be at least 6 characters')
      const existing = await db.collection('users').findOne({ email })
      if (existing) return err('Email already registered')
      const user = {
        id: uuidv4(), name, email, phone: phone || '',
        password: hashPwd(password), role: role || 'user',
        credits: 3, has_purchased_credits: false,
        location: null, city: body.city || null,
        auth_provider: 'email', created_at: new Date()
      }
      await db.collection('users').insertOne(user)
      const { password: _, _id, ...safeUser } = user
      const token = await signToken({ user_id: safeUser.id, role: safeUser.role })
      return ok({ ...safeUser, token })
    }

    if (path[0] === 'auth' && path[1] === 'send-signup-otp' && method === 'POST') {
      const body = await request.json()
      const { name, phone } = body
      if (!name || !phone) return err('Name and phone number required')

      // Phone uniqueness check — stop here so user sees error before waiting for OTP
      const cleanPhoneCheck = String(phone).replace(/\D/g, '').slice(-10)
      const existingPhone = await db.collection('users').findOne({ phone: { $regex: new RegExp(cleanPhoneCheck + '$') } })
      if (existingPhone) return err('This phone number is already registered. Please login instead.')

      // Rate limiting — max 3 OTPs per phone per 10 minutes
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
      const recentOtp = await db.collection('signup_otps').findOne({ phone })
      if (recentOtp && recentOtp.otp_count >= 3 && new Date(recentOtp.updated_at) > tenMinAgo) {
        return err('Too many OTP requests. Please wait 10 minutes before trying again.', 429)
      }

      const otp = String(Math.floor(100000 + Math.random() * 900000))
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      await db.collection('signup_otps').updateOne(
        { phone },
        {
          $set: { phone, name, otp_hash: hashOtp(otp), expires_at: expiresAt, updated_at: new Date() },
          $inc: { otp_count: 1 },
          $setOnInsert: { created_at: new Date() }
        },
        { upsert: true }
      )

      const twoFactorKey = process.env.TWO_FACTOR_API_KEY
      if (twoFactorKey) {
        const sent = await sendOtpSms(phone, otp)
        if (!sent) return err('Failed to send OTP. Please check your number and try again.', 503)
      } else {
        console.log(`[Dev] Signup OTP for ${phone}: ${otp}`)
        return ok({ message: 'OTP generated (dev mode)', dev_otp: otp })
      }
      return ok({ message: 'OTP sent to your phone' })
    }

    if (path[0] === 'auth' && path[1] === 'verify-signup-otp' && method === 'POST') {
      const body = await request.json()
      const { phone, otp, name, email, password, firebase_verified } = body
      if (!phone || !email || !password) return err('Phone, email, and password required')

      // Firebase already verified OTP on the client — skip our own OTP check
      let otpDoc = null
      if (!firebase_verified) {
        if (!otp) return err('OTP required')
        otpDoc = await db.collection('signup_otps').findOne({ phone })
        if (!otpDoc) return err('Please request OTP first', 404)
        if (new Date(otpDoc.expires_at).getTime() < Date.now()) {
          await db.collection('signup_otps').deleteOne({ phone })
          return err('OTP expired. Please request a new OTP', 410)
        }
        const expectedHash = Buffer.from(hashOtp(otp), 'hex')
        const actualHash = Buffer.from(otpDoc.otp_hash, 'hex')
        if (expectedHash.length !== actualHash.length || !crypto.timingSafeEqual(expectedHash, actualHash)) return err('Invalid OTP', 401)
      }

      const existing = await db.collection('users').findOne({ email })
      if (existing) return err('Email already registered')

      const user = {
        id: uuidv4(),
        name: name || (otpDoc?.name) || 'User',
        email,
        phone,
        password: hashPwd(password),
        role: 'user',
        credits: 3,
        has_purchased_credits: false,
        location: null,
        city: null,
        auth_provider: 'email',
        created_at: new Date()
      }

      await db.collection('users').insertOne(user)
      await db.collection('signup_otps').deleteOne({ phone })
      const { password: _, _id, ...safeUser } = user
      const token = await signToken({ user_id: safeUser.id, role: safeUser.role })
      return ok({ ...safeUser, token })
    }
    
    if (path[0] === 'auth' && path[1] === 'login' && method === 'POST') {
      const { email, password } = await request.json()
      if (!email || !password) return err('Email and password required')
      // Rate limit: max 10 failed login attempts per email per 15 minutes
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000)
      const loginAttempts = await db.collection('login_attempts').findOne({ email })
      if (loginAttempts && loginAttempts.count >= 10 && new Date(loginAttempts.updated_at) > fifteenMinAgo) {
        return err('Too many login attempts. Please wait 15 minutes.', 429)
      }
      const user = await db.collection('users').findOne({ email, password: hashPwd(password) })
      if (!user) {
        await db.collection('login_attempts').updateOne(
          { email },
          { $inc: { count: 1 }, $set: { updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
          { upsert: true }
        )
        return err('Invalid credentials', 401)
      }
      // Success — clear attempt counter
      await db.collection('login_attempts').deleteOne({ email })
      const { password: _, _id, ...safeUser } = user
      const token = await signToken({ user_id: safeUser.id, role: safeUser.role })
      return ok({ ...safeUser, token })
    }

    // ---- Phone OTP Login ----
    if (path[0] === 'auth' && path[1] === 'send-login-otp' && method === 'POST') {
      const { phone } = await request.json()
      if (!phone) return err('Phone number required')
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      const user = await db.collection('users').findOne({ phone: { $regex: new RegExp(cleanPhone + '$') } })
      if (!user) return err('No account found with this phone number', 404)
      const otp = String(Math.floor(100000 + Math.random() * 900000))
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await db.collection('login_otps').updateOne(
        { phone: cleanPhone },
        { $set: { phone: cleanPhone, otp_hash: hashOtp(otp), expires_at: expiresAt, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
        { upsert: true }
      )
      const twoFactorKey = process.env.TWO_FACTOR_API_KEY
      if (twoFactorKey) {
        const sent = await sendOtpSms(cleanPhone, otp)
        if (!sent) return err('Failed to send OTP. Please check your number and try again.', 503)
        return ok({ message: 'OTP sent to your phone' })
      }
      return ok({ message: 'OTP generated (dev mode)', dev_otp: otp })
    }

    if (path[0] === 'auth' && path[1] === 'verify-login-otp' && method === 'POST') {
      const { phone, otp } = await request.json()
      if (!phone || !otp) return err('Phone and OTP required')
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      const otpDoc = await db.collection('login_otps').findOne({ phone: cleanPhone })
      if (!otpDoc) return err('Please request OTP first', 404)
      if (new Date(otpDoc.expires_at).getTime() < Date.now()) {
        await db.collection('login_otps').deleteOne({ phone: cleanPhone })
        return err('OTP expired. Please request a new OTP', 410)
      }
      const expectedLoginHash = Buffer.from(hashOtp(otp), 'hex')
      const actualLoginHash = Buffer.from(otpDoc.otp_hash, 'hex')
      if (expectedLoginHash.length !== actualLoginHash.length || !crypto.timingSafeEqual(expectedLoginHash, actualLoginHash)) return err('Invalid OTP', 401)
      await db.collection('login_otps').deleteOne({ phone: cleanPhone })
      const user = await db.collection('users').findOne({ phone: { $regex: new RegExp(cleanPhone + '$') } })
      if (!user) return err('User not found', 404)
      const { password: _, _id, ...safeUser } = user
      const token = await signToken({ user_id: safeUser.id, role: safeUser.role })
      return ok({ ...safeUser, token })
    }

    // ---- Forgot Password — Send OTP ----
    if (path[0] === 'auth' && path[1] === 'forgot-otp' && method === 'POST') {
      const { identifier } = await request.json()
      if (!identifier) return err('Email or phone number required')
      let user
      if (identifier.includes('@')) {
        user = await db.collection('users').findOne({ email: identifier.toLowerCase().trim() })
      } else {
        const cleanPhone = identifier.replace(/\D/g, '').slice(-10)
        user = await db.collection('users').findOne({ phone: { $regex: new RegExp(cleanPhone + '$') } })
      }
      if (!user) return err('No account found with this email or phone', 404)
      if (!user.phone) return err('No phone number linked to this account. Please contact support.', 400)
      const cleanPhone = user.phone.replace(/\D/g, '').slice(-10)
      const otp = String(Math.floor(100000 + Math.random() * 900000))
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await db.collection('forgot_otps').updateOne(
        { phone: cleanPhone },
        { $set: { phone: cleanPhone, otp_hash: hashOtp(otp), expires_at: expiresAt, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
        { upsert: true }
      )
      const twoFactorKey = process.env.TWO_FACTOR_API_KEY
      if (twoFactorKey) {
        const sent = await sendOtpSms(cleanPhone, otp)
        if (!sent) return err('Failed to send OTP. Please check your number.', 503)
        return ok({ message: 'OTP sent', phone: cleanPhone })
      }
      return ok({ message: 'OTP generated (dev mode)', dev_otp: otp, phone: cleanPhone })
    }

    // ---- Forgot Password — Reset ----
    if (path[0] === 'auth' && path[1] === 'reset-password' && method === 'POST') {
      const { phone, otp, new_password } = await request.json()
      if (!phone || !otp || !new_password) return err('Phone, OTP and new password required')
      if (new_password.length < 6) return err('Password must be at least 6 characters')
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)
      const otpDoc = await db.collection('forgot_otps').findOne({ phone: cleanPhone })
      if (!otpDoc) return err('Please request OTP first', 404)
      if (new Date(otpDoc.expires_at).getTime() < Date.now()) {
        await db.collection('forgot_otps').deleteOne({ phone: cleanPhone })
        return err('OTP expired. Please request a new one.', 410)
      }
      const expectedHash = Buffer.from(hashOtp(otp), 'hex')
      const actualHash = Buffer.from(otpDoc.otp_hash, 'hex')
      if (expectedHash.length !== actualHash.length || !crypto.timingSafeEqual(expectedHash, actualHash)) return err('Invalid OTP', 401)
      await db.collection('forgot_otps').deleteOne({ phone: cleanPhone })
      const result = await db.collection('users').updateOne(
        { phone: { $regex: new RegExp(cleanPhone + '$') } },
        { $set: { password: hashPwd(new_password), updated_at: new Date() } }
      )
      if (!result.matchedCount) return err('User not found', 404)
      return ok({ success: true, message: 'Password reset successfully! Please login.' })
    }

    // ====== DELETE ACCOUNT ======
    if (path[0] === 'auth' && path[1] === 'delete-account' && method === 'POST') {
      const { email, password } = await request.json()
      if (!email || !password) return err('Email and password required')
      const user = await db.collection('users').findOne({ email, password: hashPwd(password) })
      if (!user) return err('Invalid email or password', 401)
      // Delete user data
      await db.collection('users').deleteOne({ id: user.id })
      await db.collection('orders').deleteMany({ user_id: user.id })
      await db.collection('designs').deleteMany({ user_id: user.id })
      const cleanPhone = user.phone?.replace(/\D/g, '').slice(-10)
      if (cleanPhone) {
        await db.collection('signup_otps').deleteMany({ phone: { $in: [user.phone, cleanPhone] } })
        await db.collection('login_otps').deleteMany({ phone: { $in: [user.phone, cleanPhone] } })
      }
      return ok({ success: true, message: 'Account deleted successfully' })
    }

    // ====== AUTH GOOGLE ======
    if (path[0] === 'auth' && path[1] === 'google' && method === 'POST') {
      const { google_id, email, name, photo_url, city } = await request.json()
      if (!google_id || !email) return err('google_id and email required')
      let user = await db.collection('users').findOne({ $or: [{ google_id }, { email }] })
      if (!user) {
        user = {
          id: uuidv4(), name: name || email.split('@')[0], email,
          phone: '', password: null, role: 'user',
          credits: 3, has_purchased_credits: false,
          location: null, city: city || null,
          google_id, photo_url: photo_url || null,
          auth_provider: 'google', created_at: new Date()
        }
        await db.collection('users').insertOne(user)
      } else if (!user.google_id) {
        await db.collection('users').updateOne({ id: user.id }, { $set: { google_id, photo_url, auth_provider: 'google' } })
        user = { ...user, google_id, photo_url }
      }
      const { password: _, _id, ...safeUser } = user
      const token = await signToken({ user_id: safeUser.id, role: safeUser.role })
      return ok({ ...safeUser, token })
    }

    // ====== CITIES MANAGEMENT ======
    if (path[0] === 'cities' && method === 'GET') {
      const cities = await db.collection('allowed_cities').find({}).sort({ name: 1 }).toArray()
      return ok(cities.map(({ _id, ...c }) => c))
    }
    if (path[0] === 'cities' && !path[1] && method === 'POST') {
      const { name, state } = await request.json()
      if (!name) return err('City name required')
      const existing = await db.collection('allowed_cities').findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } })
      if (existing) return err('City already exists')
      const city = { id: uuidv4(), name: name.trim(), state: state || '', active: true, created_at: new Date() }
      await db.collection('allowed_cities').insertOne(city)
      const { _id, ...clean } = city
      return ok(clean)
    }
    if (path[0] === 'cities' && path[1] && method === 'PUT') {
      const body = await request.json(); delete body._id
      await db.collection('allowed_cities').updateOne({ id: path[1] }, { $set: body })
      const city = await db.collection('allowed_cities').findOne({ id: path[1] })
      if (!city) return err('City not found', 404)
      const { _id, ...clean } = city; return ok(clean)
    }
    if (path[0] === 'cities' && path[1] && method === 'DELETE') {
      await db.collection('allowed_cities').deleteOne({ id: path[1] })
      return ok({ success: true })
    }
    if (path[0] === 'city-check' && method === 'POST') {
      const { city } = await request.json()
      const allowed = await isCityAllowed(db, city)
      const cities = await db.collection('allowed_cities').find({ active: true }).sort({ name: 1 }).toArray()
      return ok({ allowed, city, active_cities: cities.map(c => c.name) })
    }

    // ====== ITEMS ======
    if (path[0] === 'items' && !path[1] && method === 'GET') {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const query = {}; if (category) query.category = category
      const items = await db.collection('items').find(query).toArray()
      return ok(items.map(({ _id, ...item }) => item))
    }
    if (path[0] === 'items' && !path[1] && method === 'POST') {
      const body = await request.json()
      const item = { id: uuidv4(), name: body.name, description: body.description || '', category: body.category || 'general', price: Number(body.selling_price_unit || body.price || 0), selling_price_unit: Number(body.selling_price_unit || body.price || 0), unit_cost: Number(body.unit_cost || 0), color: body.color || '', size: body.size || '', image_url: body.image_url || '', stock_count: Number(body.stock_count) || 0, tags: body.tags || [], is_rentable: body.is_rentable || false, is_sellable: body.is_sellable !== false, active: true, created_at: new Date() }
      await db.collection('items').insertOne(item)
      const { _id, ...clean } = item; return ok(clean)
    }
    if (path[0] === 'items' && path[1] && path[1] !== 'bulk' && method === 'PUT') {
      const body = await request.json(); delete body._id
      await db.collection('items').updateOne({ id: path[1] }, { $set: body })
      const item = await db.collection('items').findOne({ id: path[1] })
      if (!item) return err('Item not found', 404)
      const { _id, ...clean } = item; return ok(clean)
    }
    if (path[0] === 'items' && path[1] && method === 'DELETE') {
      await db.collection('items').deleteOne({ id: path[1] }); return ok({ success: true })
    }

    // ====== RENT ITEMS ======
    if (path[0] === 'rent-items' && method === 'GET') {
      const items = await db.collection('rent_items').find({}).toArray()
      return ok(items.map(({ _id, ...i }) => i))
    }

    // ====== KITS ======
    if (path[0] === 'kits' && !path[1] && method === 'GET') {
      const url = new URL(request.url)
      const occasion = url.searchParams.get('occasion')
      const query = {}; if (occasion) query.occasion_tags = occasion
      const kits = await db.collection('decoration_kits').find(query).sort({ created_at: -1 }).toArray()
      return ok(kits.map(({ _id, ...k }) => k))
    }
    if (path[0] === 'kits' && path[1] && !['match','analyze','reference-images'].includes(path[1]) && method === 'GET') {
      const kit = await db.collection('decoration_kits').findOne({ id: path[1] })
      if (!kit) return err('Kit not found', 404)
      const { _id, ...clean } = kit; return ok(clean)
    }
    if (path[0] === 'kits' && !path[1] && method === 'POST') {
      const body = await request.json()
      if (!body.name) return err('Kit name required')
      const kit = { id: uuidv4(), name: body.name, description: body.description || '', occasion_tags: body.occasion_tags || [], room_types: body.room_types || [], reference_images: body.reference_images || [], kit_items: body.kit_items || [], bom: body.bom || [], labor_cost: Number(body.labor_cost) || 0, travel_cost: Number(body.travel_cost) || 500, total_items_cost: 0, final_price: Number(body.final_price) || 0, selling_total: Number(body.selling_total || body.final_price) || 0, purchase_total: Number(body.purchase_total) || 0, setup_time_minutes: Number(body.setup_time_minutes) || 60, difficulty: body.difficulty || 'medium', color_theme: body.color_theme || '', notes: body.notes || '', is_active: body.is_active !== false, active: body.active !== false, kit_code: body.kit_code || '', theme: body.theme || '', audience: body.audience || '', created_at: new Date(), updated_at: new Date() }
      kit.total_items_cost = (kit.kit_items || []).reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0)
      if (!kit.final_price) kit.final_price = kit.total_items_cost + kit.labor_cost + kit.travel_cost
      if (!kit.selling_total) kit.selling_total = kit.final_price
      await db.collection('decoration_kits').insertOne(kit)
      const { _id, ...clean } = kit; return ok(clean)
    }
    if (path[0] === 'kits' && path[1] && !['match','analyze','reference-images'].includes(path[1]) && method === 'PUT') {
      const body = await request.json(); delete body._id; body.updated_at = new Date()
      await db.collection('decoration_kits').updateOne({ id: path[1] }, { $set: body })
      const kit = await db.collection('decoration_kits').findOne({ id: path[1] })
      if (!kit) return err('Kit not found', 404)
      const { _id, ...clean } = kit; return ok(clean)
    }
    if (path[0] === 'kits' && path[1] && !['match','analyze','reference-images'].includes(path[1]) && method === 'DELETE') {
      await db.collection('decoration_kits').deleteOne({ id: path[1] }); return ok({ success: true })
    }
    if (path[0] === 'kits' && path[1] === 'match' && method === 'GET') {
      const url = new URL(request.url)
      const occasion = url.searchParams.get('occasion')
      const query = { is_active: true }; if (occasion) query.occasion_tags = occasion
      let kits = await db.collection('decoration_kits').find(query).toArray()
      if (kits.length === 0) kits = await db.collection('decoration_kits').find({ is_active: true }).toArray()
      return ok(kits.map(({ _id, ...k }) => k))
    }
    if (path[0] === 'kits' && path[1] === 'analyze' && method === 'POST') {
      const { image_base64, name } = await request.json()
      if (!image_base64) return err('image_base64 required')
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 60000)
        const aiRes = await fetch(`${AI_SERVICE_URL}/analyze-decoration`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_base64, name: name || '' }), signal: controller.signal })
        clearTimeout(timeout)
        return ok(await aiRes.json())
      } catch (e) { return err('Image analysis failed: ' + e.message, 500) }
    }
    if (path[0] === 'kits' && path[1] === 'reference-images' && path.length === 2 && method === 'POST') {
      const { name, image_base64, tags, occasion, description } = await request.json()
      if (!name || !image_base64) return err('name and image_base64 required')
      const ref = { id: uuidv4(), name, image_base64, tags: tags || [], occasion: occasion || '', description: description || '', created_at: new Date() }
      await db.collection('reference_images').insertOne(ref)
      const { _id, ...clean } = ref; return ok(clean)
    }
    if (path[0] === 'kits' && path[1] === 'reference-images' && path.length === 2 && method === 'GET') {
      const refs = await db.collection('reference_images').find({}).sort({ created_at: -1 }).toArray()
      return ok(refs.map(({ _id, image_base64, ...r }) => ({ ...r, has_image: !!image_base64 })))
    }
    if (path[0] === 'kits' && path[1] === 'reference-images' && path[2] && method === 'DELETE') {
      await db.collection('reference_images').deleteOne({ id: path[2] }); return ok({ success: true })
    }

    // ====== DESIGNS ======
    if (path[0] === 'designs' && path[1] === 'generate' && method === 'POST') {
      const body = await request.json()
      const { room_type, occasion, description, original_image, budget_min, budget_max } = body
      const user_id = await getUserIdFromRequest(request, body.user_id)
      if (!user_id || !room_type || !occasion) return err('user_id, room_type, occasion required')

      // ── Validate inputs ──────────────────────────────────────────────────
      const VALID_ROOM_TYPES = ['Dining Room','Living Room','Bedroom','Balcony','Garden','Hall','Office','Terrace']
      const VALID_OCCASIONS  = ['birthday','anniversary','wedding','dinner','party','baby_shower','engagement','corporate','festival','housewarming']
      if (!VALID_ROOM_TYPES.includes(room_type)) return err('Invalid room type', 400)
      if (!VALID_OCCASIONS.includes(occasion))   return err('Invalid occasion', 400)
      const VALID_BUDGETS = [[3000,5000],[5000,10000],[10000,15000],[15000,20000],[20000,30000],[30000,50000]]
      const bMin = Number(budget_min) || 3000
      const bMax = Number(budget_max) || 5000
      if (!VALID_BUDGETS.some(([mn,mx]) => mn === bMin && mx === bMax)) return err('Invalid budget range', 400)
      const safeDescription = description ? String(description).slice(0, 200) : ''

      // ── Check user + credits ─────────────────────────────────────────────
      const user = await db.collection('users').findOne({ id: user_id })
      if (!user) return err('User not found', 404)
      if (user.credits <= 0) return err('No credits remaining. Please purchase credits.', 402)

      // ── Fetch all DB data in parallel ────────────────────────────────────
      const [allKits, allItems, allRentItems] = await Promise.all([
        db.collection('decoration_kits').find({ active: true }).toArray(),
        db.collection('items').find({ stock_count: { $gt: 0 } }).toArray(),
        bMax > 5000
          ? db.collection('rent_items').find({ active: true }).toArray()
          : Promise.resolve([])
      ])
      if (allItems.length === 0) return err('No decoration items in database. Please seed first.', 500)

      // ── Prepare simplified data for AI (minimal tokens) ──────────────────
      // occasion_tags stored as array in DB — normalise to string for AI + JS string ops
      const toTagStr = (v) => Array.isArray(v) ? v.join(', ') : (v || '')
      const kitsForAI = allKits.map(k => ({
        id: k.id, name: k.name || '',
        occasion_tags: toTagStr(k.occasion_tags),
        selling_total: Number(k.selling_total || k.final_price || 0),
        color_theme: k.color_theme || ''
      }))
      const itemsForAI = allItems.map(i => ({
        id: i.id, name: i.name || '',
        category: i.category || '',
        color: i.type_finish || i.color || '',
        price: i.selling_price_unit || i.price || 0,
        size: i.size || ''
      }))
      const rentForAI = allRentItems.map(r => ({
        id: r.id, name: r.name || '',
        category: r.category || '',
        price: r.selling_price || r.rental_cost || 0
      }))

      // ── Call /smart-generate (AI selects + writes prompt + FLUX) ─────────
      const designId = uuidv4()
      let decoratedImageUrl = null
      let selectedKit = null, kitItems = [], kitCost = 0
      let addOnItems = [], addOnCost = 0, aiSucceeded = false

      try {
        const controller = new AbortController()
        const aiTimeout  = setTimeout(() => controller.abort(), 90000)
        const aiRes = await fetch(`${AI_SERVICE_URL}/smart-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budget_min: bMin, budget_max: bMax,
            occasion, room_type,
            description: safeDescription,
            image_base64: (original_image && original_image.includes('base64')) ? original_image : null,
            kits: kitsForAI, items: itemsForAI, rent_items: rentForAI
          }),
          signal: controller.signal
        })
        clearTimeout(aiTimeout)
        const aiData = await aiRes.json()
        if (!aiData.success || !aiData.image_url) throw new Error(aiData.detail || 'AI generation failed')

        // ── Build design record from AI-validated selections ───────────────
        const selKitId   = aiData.selected_kit_id
        const selItemIds = new Set(aiData.selected_item_ids || [])
        const selRentIds = new Set(aiData.selected_rent_ids || [])

        selectedKit = allKits.find(k => k.id === selKitId) || null
        kitCost     = selectedKit ? (selectedKit.selling_total || selectedKit.final_price || 0) : 0
        kitItems    = selectedKit
          ? (selectedKit.bom || selectedKit.kit_items || []).map(bi => ({
              id: uuidv4(), name: bi.item || bi.name || 'Item',
              description: `${bi.item || bi.name || 'Item'} - ${bi.uom || 'pc'}`,
              price: Number(bi.unit_purchase || bi.unit_price || 0),
              quantity: Number(bi.qty || bi.quantity || 1),
              category: 'kit_item', color: '', size: bi.uom || '',
              image_url: '', is_kit_item: true
            }))
          : []

        addOnItems = [
          ...allItems
            .filter(i => selItemIds.has(i.id))
            .map(i => ({
              id: i.id, name: i.name,
              description: i.type_finish || i.category || '',
              price: i.selling_price_unit || i.price || 0,
              quantity: 1, category: i.category || '',
              color: i.type_finish || i.color || '', size: i.size || '',
              image_url: i.image_url || '', is_kit_item: false, is_rentable: false
            })),
          ...allRentItems
            .filter(r => selRentIds.has(r.id))
            .map(r => ({
              id: r.id, name: r.name,
              description: r.category || '',
              price: r.selling_price || r.rental_cost || 0,
              quantity: 1, category: r.category || '',
              color: '', size: '', image_url: r.image_url || '',
              is_kit_item: false, is_rentable: true
            }))
        ]
        addOnCost = addOnItems.reduce((s, i) => s + (Number(i.price) || 0), 0)

        // ── Upload fal.ai image to ImageKit for permanent CDN storage ──────
        try {
          const falBuf    = await (await fetch(aiData.image_url)).arrayBuffer()
          const falBase64 = Buffer.from(falBuf).toString('base64')
          const ikAuth    = Buffer.from((process.env.IMAGEKIT_PRIVATE_KEY || '') + ':').toString('base64')
          const ikBody    = new URLSearchParams()
          ikBody.append('file', falBase64)
          ikBody.append('fileName', `design_${designId}.jpg`)
          ikBody.append('folder', '/generated')
          const ikRes  = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${ikAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: ikBody.toString()
          })
          const ikData = await ikRes.json()
          decoratedImageUrl = ikData.url || aiData.image_url
        } catch (_ikErr) { decoratedImageUrl = aiData.image_url }

        aiSucceeded = true

      } catch (aiErr) {
        // ── Fallback: old DB logic + direct /generate ──────────────────────
        console.warn('[designs/generate] smart-generate failed, using fallback:', aiErr.message)
        const isTimeout = aiErr.name === 'AbortError' || aiErr.message?.includes('aborted')
        if (isTimeout) return err('AI generation timed out. Please try again.', 500)

        const occasionMap = { birthday:['birthday','Birthday'], anniversary:['anniversary','Anniversary'], wedding:['wedding','Wedding'], baby_shower:['Ceremony','baby_shower'], engagement:['Proposal','engagement'], party:['birthday','Birthday'], housewarming:['housewarming'], corporate:['corporate'], dinner:['anniversary','Anniversary'], festival:['Holi','festival'] }
        const tagVariants = occasionMap[occasion] || [occasion]
        let matchingKits = allKits.filter(k => tagVariants.some(t => toTagStr(k.occasion_tags).toLowerCase().includes(t.toLowerCase())) && Number(k.selling_total||k.final_price||0) <= bMax)
        if (matchingKits.length === 0) matchingKits = allKits.filter(k => Number(k.selling_total||k.final_price||0) <= bMax)
        if (matchingKits.length > 0) {
          selectedKit = matchingKits.sort((a,b) => Number(b.selling_total||b.final_price||0)-Number(a.selling_total||a.final_price||0))[0]
          kitCost = Number(selectedKit.selling_total || selectedKit.final_price || 0)
          kitItems = (selectedKit.bom || selectedKit.kit_items || []).map(bi => ({ id:uuidv4(), name:bi.item||bi.name||'Item', description:`${bi.item||bi.name||'Item'} - ${bi.uom||'pc'}`, price:Number(bi.unit_purchase||bi.unit_price||0), quantity:Number(bi.qty||bi.quantity||1), category:'kit_item', color:'', size:bi.uom||'', image_url:'', is_kit_item:true }))
          let addonSpent = 0
          for (const item of allItems.sort(() => Math.random() - 0.5)) {
            if (addonSpent >= bMax - kitCost) break
            const isRentable = item.is_rentable || item.category === 'Neon Signs' || item.category === 'Lighting'
            if (bMax <= 5000 && isRentable) continue
            const price = item.selling_price_unit || item.price || 0
            if (price > 0 && addonSpent + price <= bMax - kitCost) { addOnItems.push({ id:item.id, name:item.name, description:item.type_finish||item.category||'', price, quantity:1, category:item.category||'', color:item.type_finish||'', size:item.size||'', image_url:item.image_url||'', is_kit_item:false, is_rentable:isRentable }); addonSpent += price }
          }
          addOnCost = addonSpent
        } else {
          let spent = 0
          for (const item of allItems.sort(() => Math.random() - 0.5)) {
            if (spent >= bMax) break
            const isRentable = item.is_rentable || item.category === 'Neon Signs' || item.category === 'Lighting'
            if (bMax <= 5000 && isRentable) continue
            const price = item.selling_price_unit || item.price || 0
            if (price > 0 && spent + price <= bMax) { addOnItems.push({ id:item.id, name:item.name, description:item.type_finish||item.category||'', price, quantity:1, category:item.category||'', color:item.type_finish||'', size:item.size||'', image_url:item.image_url||'', is_kit_item:false, is_rentable:isRentable }); spent += price }
          }
          addOnCost = spent
        }
        const rentCategoryMap = { birthday:['Lighting','Stands'], party:['Lighting','Stands'], anniversary:['Lighting','Floral'], wedding:['Floral','Stands','Lighting'], engagement:['Floral','Lighting'], baby_shower:['Floral','Lighting'], housewarming:['Floral','Lighting'], corporate:['Stands','Lighting'] }
        const rentCategories  = rentCategoryMap[occasion] || ['Lighting']
        const remainingForRent = Math.max(0, bMax - kitCost - addOnCost)
        let rentSpent = 0
        for (const r of allRentItems.filter(ri => rentCategories.includes(ri.category))) {
          const price = r.selling_price || r.rental_cost
          if (price > 0 && rentSpent + price <= remainingForRent && addOnItems.filter(i=>i.is_rentable).length < 2) { addOnItems.push({ id:r.id, name:r.name, description:r.category, price, quantity:1, category:r.category, color:'', size:'', image_url:r.image_url||'', is_kit_item:false, is_rentable:true }); rentSpent += price }
        }
        addOnCost += rentSpent
        const allSelected = [...kitItems, ...addOnItems]
        const itemDescs   = allSelected.map(i => { const c = i.color && i.color.toLowerCase() !== 'mixed' ? `${i.color} ` : ''; return `${c}${(i.category||'decoration').replace(/_/g,' ')}` }).join(', ')
        const noText = 'CRITICAL: Do NOT write any text, words, letters, numbers, or labels anywhere in the image. The image must be completely text-free.'
        const hasUserImg = !!(original_image && original_image.includes('base64'))
        const fallbackPrompt = hasUserImg
          ? `Decorate this exact ${room_type} for a ${occasion}. Keep all existing furniture unchanged. Add: ${itemDescs}. ${safeDescription ? 'Special: ' + safeDescription + '.' : ''} ${noText} Photorealistic, warm lighting.`
          : `Professional photorealistic ${room_type} decorated for ${occasion}. Show: ${itemDescs}. ${safeDescription ? 'Special: ' + safeDescription + '.' : ''} ${noText} High quality, warm lighting, 4K.`
        try {
          const fbController = new AbortController()
          const fbTimeout    = setTimeout(() => fbController.abort(), 60000)
          const fbBody       = { prompt: fallbackPrompt }
          if (hasUserImg) fbBody.image_base64 = original_image
          const fbRes  = await fetch(`${AI_SERVICE_URL}/generate`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(fbBody), signal:fbController.signal })
          clearTimeout(fbTimeout)
          const fbData = await fbRes.json()
          if (!fbData.success) throw new Error(fbData.detail || 'Fallback generation failed')
          try {
            const falBuf    = await (await fetch(fbData.image_url)).arrayBuffer()
            const falBase64 = Buffer.from(falBuf).toString('base64')
            const ikAuth    = Buffer.from((process.env.IMAGEKIT_PRIVATE_KEY||'') + ':').toString('base64')
            const ikBody    = new URLSearchParams()
            ikBody.append('file', falBase64); ikBody.append('fileName', `design_${designId}.jpg`); ikBody.append('folder', '/generated')
            const ikRes  = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method:'POST', headers:{'Authorization':`Basic ${ikAuth}`,'Content-Type':'application/x-www-form-urlencoded'}, body:ikBody.toString() })
            const ikData = await ikRes.json()
            decoratedImageUrl = ikData.url || fbData.image_url
          } catch (_) { decoratedImageUrl = fbData.image_url }
        } catch (fbErr) {
          const isTo = fbErr.name === 'AbortError' || fbErr.message?.includes('aborted')
          return err(isTo ? 'AI generation timed out. Please try again.' : 'AI image generation failed. Please try again.', 500)
        }
      }

      // ── Deduct credit atomically ──────────────────────────────────────────
      const creditResult = await db.collection('users').findOneAndUpdate(
        { id: user_id, credits: { $gt: 0 } },
        { $inc: { credits: -1 } },
        { returnDocument: 'after' }
      )
      if (!creditResult) return err('No credits remaining. Please purchase credits.', 402)

      // ── Save design to MongoDB ────────────────────────────────────────────
      const allSelectedItems = [...kitItems, ...addOnItems]
      const totalCost        = kitCost + addOnCost
      const hasUserImage     = !!(original_image && original_image.includes('base64'))
      const design = {
        id: designId, user_id, room_type, occasion,
        description: safeDescription,
        original_image: hasUserImage ? '[uploaded]' : null,
        decorated_image: decoratedImageUrl,
        kit_id: selectedKit?.id || null,
        kit_name: selectedKit?.name || null,
        kit_items: kitItems, kit_cost: kitCost,
        addon_items: addOnItems, addon_cost: addOnCost,
        items_used: allSelectedItems, total_cost: totalCost,
        ai_selected: aiSucceeded,
        status: 'generated', created_at: new Date()
      }
      await db.collection('designs').insertOne(design)
      const { _id, ...cleanDesign } = design
      return ok({ ...cleanDesign, remaining_credits: creditResult.credits, kit_used: !!selectedKit })
    }
    if (path[0] === 'designs' && !path[1] && method === 'GET') {
      const url = new URL(request.url)
      const user_id = await getUserIdFromRequest(request, url.searchParams.get('user_id'))
      if (!user_id) return err('user_id required')
      const designs = await db.collection('designs').find({ user_id }).sort({ created_at: -1 }).limit(50).toArray()
      return ok(designs.map(({ _id, ...d }) => d))
    }
    if (path[0] === 'designs' && path[1] && path[1] !== 'generate' && method === 'GET') {
      const design = await db.collection('designs').findOne({ id: path[1] })
      if (!design) return err('Design not found', 404)
      const { _id, ...clean } = design; return ok(clean)
    }

    // ====== ORDERS ======
    if (path[0] === 'orders' && !path[1] && method === 'POST') {
      const body = await request.json()
      const { design_id, delivery_address, delivery_landmark, delivery_lat, delivery_lng, total_override } = body
      const user_id = await getUserIdFromRequest(request, body.user_id)
      if (!user_id || !design_id) return err('user_id, design_id required')
      const design = await db.collection('designs').findOne({ id: design_id })
      if (!design) return err('Design not found', 404)
      // Validate total_override — must be between 50% and 100% of original total
      let finalTotal = design.total_cost
      if (total_override) {
        const overrideNum = Math.round(Number(total_override))
        const minAllowed = Math.round(design.total_cost * 0.5)
        if (overrideNum < minAllowed || overrideNum > design.total_cost) {
          return err('Invalid total override amount', 400)
        }
        finalTotal = overrideNum
      }
      const order = { id: uuidv4(), user_id, design_id, items: design.items_used, total_cost: finalTotal, payment_status: 'pending', payment_amount: 0, delivery_person_id: null, delivery_slot: null, delivery_status: 'pending', delivery_address: delivery_address || '', delivery_landmark: delivery_landmark || '', delivery_location: { lat: delivery_lat || null, lng: delivery_lng || null }, assigned_decorators: [], accepted_decorators: [], created_at: new Date() }
      await db.collection('orders').insertOne(order)
      // Notify ALL active decorators — each will see the request and first 2 to accept get the job
      const availablePersons = await db.collection('delivery_persons').find({ is_active: true }).toArray()
      if (availablePersons.length > 0) {
        const assignedIds = availablePersons.map(p => p.id)
        const assignedInfo = availablePersons.map(p => ({ id: p.id, name: p.name, phone: p.phone }))
        await db.collection('orders').updateOne({ id: order.id }, { $set: { assigned_decorators: assignedIds, assigned_decorators_info: assignedInfo } })
        order.assigned_decorators = assignedIds
        order.assigned_decorators_info = assignedInfo
        // WhatsApp notification to every active decorator
        for (const dp of availablePersons) {
          if (dp.phone) {
            await sendWhatsApp(dp.phone, `FatafatDecor NEW ORDER #${order.id.slice(0,8)}: ${order.delivery_address || 'Address not set'}. Amount: Rs.${order.total_cost}. Open your decorator app now to accept! -FatafatDecor`)
          }
        }
      }
      await db.collection('designs').updateOne({ id: design_id }, { $set: { status: 'ordered' } })
      // WhatsApp: order placed confirmation to customer
      const orderUser = await db.collection('users').findOne({ id: user_id })
      if (orderUser?.phone) {
        await sendWhatsApp(orderUser.phone, `FatafatDecor: Your decoration order has been placed successfully! Total: Rs.${order.total_cost}. Decorators are being assigned. -FatafatDecor`)
      }
      const { _id, ...clean } = order; return ok(clean)
    }
    if (path[0] === 'orders' && !path[1] && method === 'GET') {
      const url = new URL(request.url)
      const user_id = await getUserIdFromRequest(request, url.searchParams.get('user_id'))
      if (!user_id) return err('user_id required')
      const orders = await db.collection('orders').find({ user_id }).sort({ created_at: -1 }).limit(50).toArray()
      return ok(orders.map(({ _id, ...o }) => o))
    }
    if (path[0] === 'orders' && path[1] && method === 'GET') {
      const order = await db.collection('orders').findOne({ id: path[1] })
      if (!order) return err('Order not found', 404)
      const { _id, ...clean } = order; return ok(clean)
    }
    // Save requested delivery slot (without booking — awaiting decorator acceptance)
    if (path[0] === 'orders' && path[2] === 'request-slot' && method === 'POST') {
      const body = await request.json()
      const { date, hour } = body
      const user_id = await getUserIdFromRequest(request, body.user_id)
      if (!date || hour === undefined || !user_id) return err('date, hour, user_id required')
      const slotOrder = await db.collection('orders').findOne({ id: path[1] })
      if (!slotOrder) return err('Order not found', 404)
      if (slotOrder.user_id !== user_id) return err('Not authorized', 403)
      await db.collection('orders').updateOne({ id: path[1] }, { $set: { requested_slot: { date, hour }, delivery_status: 'pending' } })
      return ok({ success: true })
    }

    // ====== PAYMENTS ======
    if (path[0] === 'payments' && path[1] === 'create-order' && method === 'POST') {
      const body = await request.json()
      const { type, amount, order_id, credits_count } = body
      const user_id = await getUserIdFromRequest(request, body.user_id)
      if (!type || !amount || !user_id) return err('type, amount, user_id required')
      try {
        const Razorpay = (await import('razorpay')).default
        const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
        const rzpOrder = await rzp.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `${type}_${uuidv4().slice(0, 8)}` })
        const payment = { id: uuidv4(), type, user_id, order_id: order_id || null, credits_count: credits_count || 0, amount, razorpay_order_id: rzpOrder.id, status: 'created', created_at: new Date() }
        await db.collection('payments').insertOne(payment)
        return ok({ razorpay_order_id: rzpOrder.id, amount: rzpOrder.amount, currency: 'INR', payment_id: payment.id, razorpay_key_id: process.env.RAZORPAY_KEY_ID })
      } catch (e) { return err('Payment creation failed: ' + e.message, 500) }
    }
    // Payment failure — mark payment as failed so it's visible in DB
    if (path[0] === 'payments' && path[1] === 'handle-failure' && method === 'POST') {
      const { payment_id, reason } = await request.json()
      if (payment_id) {
        await db.collection('payments').updateOne(
          { id: payment_id },
          { $set: { status: 'failed', failed_at: new Date(), failure_reason: reason || 'user_cancelled' } }
        )
      }
      return ok({ success: true })
    }

    // Order timeout / auto-reassign — called by client when order stays pending > 30 min
    if (path[0] === 'orders' && path[1] === 'auto-reassign' && method === 'POST') {
      const { order_id } = await request.json()
      if (!order_id) return err('order_id required')
      const order = await db.collection('orders').findOne({ id: order_id })
      if (!order) return err('Order not found', 404)
      // Only act if still pending with no decorator assigned
      if (order.delivery_status !== 'pending' && order.delivery_status !== 'assigned') return ok({ reassigned: false, reason: 'already progressed' })
      if (order.delivery_person_id) return ok({ reassigned: false, reason: 'decorator already assigned' })
      const ageMs = Date.now() - new Date(order.created_at).getTime()
      if (ageMs < 30 * 60 * 1000) return ok({ reassigned: false, reason: 'not timed out yet' })
      // Pick fresh decorators not in current assigned list
      const availablePersons = await db.collection('delivery_persons').find({ is_active: true }).toArray()
      const currentIds = order.assigned_decorators || []
      const fresh = availablePersons.filter(p => !currentIds.includes(p.id)).slice(0, 2)
      const reassignedIds = [...currentIds, ...fresh.map(p => p.id)]
      const reassignedInfo = [...(order.assigned_decorators_info || []), ...fresh.map(p => ({ id: p.id, name: p.name, phone: p.phone }))]
      await db.collection('orders').updateOne({ id: order_id }, {
        $set: { assigned_decorators: reassignedIds, assigned_decorators_info: reassignedInfo, last_reassigned_at: new Date() }
      })
      // Notify customer via WhatsApp
      const orderUser = await db.collection('users').findOne({ id: order.user_id })
      if (orderUser?.phone) {
        await sendWhatsApp(orderUser.phone, `FatafatDecor: We are finding the best decorator for your order. Please wait a few more minutes. -FatafatDecor`)
      }
      return ok({ reassigned: true, new_decorators: fresh.length })
    }

    if (path[0] === 'payments' && path[1] === 'verify' && method === 'POST') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return err('Missing payment fields', 400)
      const generatedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex')
      if (generatedSig !== razorpay_signature) return err('Payment verification failed', 400)
      const payment = await db.collection('payments').findOne({ razorpay_order_id })
      if (!payment) return err('Payment not found', 404)
      await db.collection('payments').updateOne({ razorpay_order_id }, { $set: { status: 'verified', razorpay_payment_id, razorpay_signature } })
      if (payment.type === 'credits') await db.collection('users').updateOne({ id: payment.user_id }, { $inc: { credits: payment.credits_count }, $set: { has_purchased_credits: true } })
      if (payment.type === 'delivery' && payment.order_id) {
        await db.collection('orders').updateOne({ id: payment.order_id }, { $set: { payment_status: 'partial', payment_amount: payment.amount } })
        // SMS: payment received
        const payUser = await db.collection('users').findOne({ id: payment.user_id })
        if (payUser?.phone) {
          await sendWhatsApp(payUser.phone, `FatafatDecor: Payment of Rs.${payment.amount} received! Your booking is confirmed. Decorator will arrive at the selected time. -FatafatDecor`)
        }
      }
      return ok({ success: true, type: payment.type })
    }

    // ====== ADMIN SLOT BLOCKING ======
    if (path[0] === 'admin' && path[1] === 'block-slot' && method === 'POST') {
      const { date, hour, blocked } = await request.json()
      if (!date || hour === undefined) return err('date and hour required')
      if (blocked) {
        await db.collection('blocked_slots').updateOne({ date, hour }, { $set: { date, hour, blocked: true, updated_at: new Date() } }, { upsert: true })
      } else {
        await db.collection('blocked_slots').deleteOne({ date, hour })
      }
      return ok({ success: true, date, hour, blocked })
    }
    if (path[0] === 'admin' && path[1] === 'blocked-slots' && method === 'GET') {
      const url = new URL(request.url)
      const date = url.searchParams.get('date')
      if (!date) return err('date required')
      const blocked = await db.collection('blocked_slots').find({ date }).toArray()
      return ok({ date, blocked_hours: blocked.map(b => b.hour) })
    }

    // ====== DELIVERY SLOTS ======
    if (path[0] === 'delivery' && path[1] === 'slots' && method === 'GET') {
      const url = new URL(request.url)
      const date = url.searchParams.get('date')
      if (!date) return err('date required (YYYY-MM-DD)')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) return err('Invalid date format. Use YYYY-MM-DD', 400)
      const deliveryPersons = await db.collection('delivery_persons').find({ is_active: true }).toArray()
      const blockedDocs = await db.collection('blocked_slots').find({ date }).toArray()
      const blockedHours = blockedDocs.map(b => b.hour)
      const slots = []
      for (let hour = 9; hour <= 20; hour++) {
        const isAdminBlocked = blockedHours.includes(hour)
        const bookedCount = deliveryPersons.filter(dp => (dp.schedule?.[date] || []).includes(hour)).length
        const available = deliveryPersons.length - bookedCount
        slots.push({ hour, time_label: `${hour}:00 - ${hour + 1}:00`, available: !isAdminBlocked && available > 0, available_count: isAdminBlocked ? 0 : available, admin_blocked: isAdminBlocked })
      }
      return ok({ date, slots })
    }
    if (path[0] === 'delivery' && path[1] === 'book' && method === 'POST') {
      const { order_id, date, hour } = await request.json()
      if (!order_id || !date || hour === undefined) return err('order_id, date, hour required')
      const order = await db.collection('orders').findOne({ id: order_id })
      if (!order) return err('Order not found', 404)
      const deliveryPersons = await db.collection('delivery_persons').find({ is_active: true }).toArray()
      let assignedPerson = deliveryPersons.find(dp => !(dp.schedule?.[date] || []).includes(hour))
      if (!assignedPerson) return err('No delivery person available for this slot.', 409)
      await db.collection('delivery_persons').updateOne({ id: assignedPerson.id }, { $push: { [`schedule.${date}`]: hour } })
      await db.collection('orders').updateOne({ id: order_id }, { $set: { delivery_person_id: assignedPerson.id, delivery_slot: { date, hour }, delivery_status: 'assigned' } })
      // SMS: slot confirmed
      const slotUser = await db.collection('users').findOne({ id: order.user_id })
      if (slotUser?.phone) {
        await sendWhatsApp(slotUser.phone, `FatafatDecor: Slot confirmed! Your decorator ${assignedPerson.name} will arrive on ${date} between ${hour}:00 - ${hour+1}:00. Contact: ${assignedPerson.phone} -FatafatDecor`)
      }
      return ok({ success: true, delivery_person: { id: assignedPerson.id, name: assignedPerson.name, phone: assignedPerson.phone }, slot: { date, hour, time_label: `${hour}:00 - ${hour + 1}:00` } })
    }
    if (path[0] === 'delivery' && path[1] === 'update-location' && method === 'POST') {
      const { delivery_person_id, lat, lng } = await request.json()
      await db.collection('delivery_persons').updateOne({ id: delivery_person_id }, { $set: { current_location: { lat, lng, updated_at: new Date() } } })
      return ok({ success: true })
    }
    if (path[0] === 'delivery' && path[1] === 'track' && path[2] && method === 'GET') {
      const order = await db.collection('orders').findOne({ id: path[2] })
      if (!order) return err('Order not found', 404)
      const assignedInfo = order.assigned_decorators_info || []
      if (!order.delivery_person_id && assignedInfo.length === 0) return ok({ order_id: order.id, delivery_status: order.delivery_status || 'pending', delivery_slot: order.delivery_slot || null, delivery_person: null, assigned_decorators: [], delivery_location: null, user_location: order.delivery_location || null, message: 'Decorators not yet assigned' })
      const dp = order.delivery_person_id ? await db.collection('delivery_persons').findOne({ id: order.delivery_person_id }) : null
      return ok({ order_id: order.id, delivery_status: order.delivery_status, delivery_slot: order.delivery_slot, delivery_person: dp ? { name: dp.name, phone: dp.phone } : null, assigned_decorators: assignedInfo, delivery_location: dp?.current_location || null, user_location: order.delivery_location || null, verification_otp: order.verification_otp || null, otp_verified: order.otp_verified || false })
    }
    if (path[0] === 'delivery' && path[1] === 'status' && method === 'POST') {
      const { order_id, status, dp_id } = await request.json()
      if (!order_id || !status || !dp_id) return err('order_id, status, dp_id required')
      const VALID_STATUSES = ['pending', 'assigned', 'en_route', 'arrived', 'decorating', 'delivered', 'cancelled']
      if (!VALID_STATUSES.includes(status)) return err('Invalid status', 400)
      const authOrder = await db.collection('orders').findOne({ id: order_id })
      if (!authOrder) return err('Order not found', 404)
      const isAssigned = (authOrder.accepted_decorators || []).includes(dp_id) || authOrder.delivery_person_id === dp_id
      if (!isAssigned) return err('Not authorized to update this order', 403)
      await db.collection('orders').updateOne({ id: order_id }, { $set: { delivery_status: status } })
      return ok({ success: true })
    }

    // ====== CREDITS ======
    if (path[0] === 'credits' && path[1] && method === 'GET') {
      const user = await db.collection('users').findOne({ id: path[1] })
      if (!user) return err('User not found', 404)
      return ok({ user_id: user.id, credits: user.credits })
    }

    // ====== DELIVERY PERSONS ======
    if (path[0] === 'delivery-persons' && !path[1] && method === 'GET') {
      const dps = await db.collection('delivery_persons').find({}).toArray()
      return ok(dps.map(({ _id, ...dp }) => dp))
    }
    if (path[0] === 'delivery-persons' && !path[1] && method === 'POST') {
      const body = await request.json()
      const dp = { id: uuidv4(), name: body.name, phone: body.phone || '', password: hashPwd(body.password || '1234'), is_active: true, current_location: null, schedule: {}, rating: 5.0, total_deliveries: 0, created_at: new Date() }
      await db.collection('delivery_persons').insertOne(dp)
      const { _id, password: _, ...clean } = dp; return ok(clean)
    }
    if (path[0] === 'delivery-persons' && path[1] && method === 'PUT') {
      const body = await request.json(); delete body._id
      await db.collection('delivery_persons').updateOne({ id: path[1] }, { $set: body })
      const dp = await db.collection('delivery_persons').findOne({ id: path[1] })
      if (!dp) return err('Delivery person not found', 404)
      const { _id, ...clean } = dp; return ok(clean)
    }

    // ====== USER LOCATION ======
    if (path[0] === 'user' && path[1] === 'location' && method === 'POST') {
      const body = await request.json()
      const { lat, lng } = body
      const user_id = await getUserIdFromRequest(request, body.user_id)
      if (!user_id) return err('user_id required')
      await db.collection('users').updateOne({ id: user_id }, { $set: { location: { lat, lng, updated_at: new Date() } } })
      return ok({ success: true })
    }

    // ====== IMAGEKIT ======
    if (path[0] === 'imagekit' && path[1] === 'reference' && method === 'GET') {
      const url = new URL(request.url)
      const budget_min = Number(url.searchParams.get('budget_min') || 3000)
      const budget_max = Number(url.searchParams.get('budget_max') || 5000)
      const folder = getImageKitFolder(budget_min, budget_max)
      return ok({ folder, base_url: IMAGEKIT_URL, folder_url: `${IMAGEKIT_URL}/${folder}`, budget_min, budget_max })
    }
    if (path[0] === 'imagekit' && path[1] === 'upload' && method === 'POST') {
      const { file_base64, file_name, folder } = await request.json()
      if (!file_base64 || !file_name) return err('file_base64 and file_name required')
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
      if (!privateKey) return err('IMAGEKIT_PRIVATE_KEY not configured', 500)
      try {
        const auth = Buffer.from(privateKey + ':').toString('base64')
        const body = new URLSearchParams()
        body.append('file', file_base64); body.append('fileName', file_name); body.append('folder', folder || '/uploads')
        const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
        const ikData = await ikRes.json()
        if (ikData.url) return ok({ success: true, url: ikData.url, fileId: ikData.fileId })
        return err('ImageKit upload failed: ' + JSON.stringify(ikData), 500)
      } catch (e) { return err('ImageKit upload error: ' + e.message, 500) }
    }

    // ====== DECORATOR APP ======
    if (path[0] === 'dp' && path[1] === 'login' && method === 'POST') {
      const { phone, password } = await request.json()
      if (!phone) return err('Phone required')
      const dp = await db.collection('delivery_persons').findOne({ phone })
      if (!dp) return err('Delivery person not found', 404)
      if (dp.password && password && dp.password !== hashPwd(password)) return err('Invalid password', 401)
      const { _id, password: _, ...safe } = dp; return ok(safe)
    }
    if (path[0] === 'dp' && path[1] === 'dashboard' && path[2] && method === 'GET') {
      const dpId = path[2]; const today = new Date().toISOString().split('T')[0]
      const dp = await db.collection('delivery_persons').findOne({ id: dpId })
      if (!dp) return err('Delivery person not found', 404)
      const todayOrders = await db.collection('orders').find({
        $or: [{ accepted_decorators: dpId }, { delivery_person_id: dpId }],
        'delivery_slot.date': today
      }).sort({ 'delivery_slot.hour': 1 }).toArray()
      const allActiveOrders = await db.collection('orders').find({
        $or: [{ accepted_decorators: dpId }, { delivery_person_id: dpId }],
        delivery_status: { $in: ['assigned', 'en_route', 'arrived', 'decorating'] }
      }).toArray()
      const pendingOrders = await db.collection('orders').find({
        assigned_decorators: dpId,
        accepted_decorators: { $not: { $elemMatch: { $eq: dpId } } },
        $expr: { $lt: [{ $size: { $ifNull: ['$accepted_decorators', []] } }, 2] }
      }).sort({ created_at: -1 }).toArray()
      const { _id, password: _, ...safeDp } = dp
      return ok({ delivery_person: safeDp, today_orders: todayOrders.map(({ _id, ...o }) => o), active_orders: allActiveOrders.map(({ _id, ...o }) => o), pending_orders: pendingOrders.map(({ _id, ...o }) => o), date: today })
    }
    if (path[0] === 'dp' && path[1] === 'calendar' && path[2] && method === 'GET') {
      const dpId = path[2]; const url = new URL(request.url); const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7)
      const dp = await db.collection('delivery_persons').findOne({ id: dpId })
      if (!dp) return err('Delivery person not found', 404)
      const orders = await db.collection('orders').find({
        $or: [{ accepted_decorators: dpId }, { delivery_person_id: dpId }],
        'delivery_slot.date': { $regex: `^${month}` }
      }).sort({ 'delivery_slot.date': 1, 'delivery_slot.hour': 1 }).toArray()
      return ok({ month, schedule: dp.schedule || {}, orders: orders.map(({ _id, ...o }) => o) })
    }
    if (path[0] === 'dp' && path[1] === 'orders' && path[2] && method === 'GET') {
      const dpId = path[2]; const url = new URL(request.url); const status = url.searchParams.get('status')
      const query = { $or: [{ accepted_decorators: dpId }, { delivery_person_id: dpId }] }
      if (status) query.delivery_status = status
      const orders = await db.collection('orders').find(query).sort({ created_at: -1 }).toArray()
      return ok(orders.map(({ _id, ...o }) => o))
    }
    if (path[0] === 'dp' && path[1] === 'generate-otp' && method === 'POST') {
      const { order_id } = await request.json()
      if (!order_id) return err('order_id required')
      const otp = String(Math.floor(1000 + Math.random() * 9000))
      await db.collection('orders').updateOne({ id: order_id }, { $set: { verification_otp: otp, otp_generated_at: new Date() } })
      return ok({ otp, order_id })
    }
    if (path[0] === 'dp' && path[1] === 'face-scan' && method === 'POST') {
      const { order_id, dp_id, face_image } = await request.json()
      if (!order_id || !dp_id || !face_image) return err('order_id, dp_id, face_image required')
      const dp = await db.collection('delivery_persons').findOne({ id: dp_id })
      if (!dp) return err('Delivery person not found', 404)
      const fsOrder = await db.collection('orders').findOne({ id: order_id })
      if (!fsOrder) return err('Order not found', 404)
      const fsAssigned = (fsOrder.accepted_decorators || []).includes(dp_id) || fsOrder.delivery_person_id === dp_id
      if (!fsAssigned) return err('Not authorized for this order', 403)
      await db.collection('orders').updateOne({ id: order_id }, { $set: { face_scan: { dp_id, dp_name: dp.name, image: face_image, scanned_at: new Date() }, delivery_status: 'arrived' } })
      return ok({ success: true, dp_name: dp.name })
    }
    if (path[0] === 'dp' && path[1] === 'verify-otp' && method === 'POST') {
      const { order_id, otp, dp_id } = await request.json()
      if (!order_id || !otp || !dp_id) return err('order_id, otp, dp_id required')
      const order = await db.collection('orders').findOne({ id: order_id })
      if (!order) return err('Order not found', 404)
      const votAssigned = (order.accepted_decorators || []).includes(dp_id) || order.delivery_person_id === dp_id
      if (!votAssigned) return err('Not authorized for this order', 403)
      if (!order.verification_otp) return err('OTP not yet generated', 400)
      const expectedOtp = Buffer.from(String(order.verification_otp))
      const actualOtp = Buffer.from(String(otp))
      if (expectedOtp.length !== actualOtp.length || !crypto.timingSafeEqual(expectedOtp, actualOtp)) return err('Invalid OTP', 401)
      const startTime = new Date()
      await db.collection('orders').updateOne({ id: order_id }, { $set: { delivery_status: 'decorating', decoration_started_at: startTime, otp_verified: true } })
      return ok({ success: true, started_at: startTime })
    }
    if (path[0] === 'dp' && path[1] === 'complete' && method === 'POST') {
      const { order_id, dp_id } = await request.json()
      if (!order_id || !dp_id) return err('order_id, dp_id required')
      const compOrder = await db.collection('orders').findOne({ id: order_id })
      if (!compOrder) return err('Order not found', 404)
      const compAssigned = (compOrder.accepted_decorators || []).includes(dp_id) || compOrder.delivery_person_id === dp_id
      if (!compAssigned) return err('Not authorized for this order', 403)
      const completedAt = new Date()
      await db.collection('orders').updateOne({ id: order_id }, { $set: { delivery_status: 'delivered', decoration_completed_at: completedAt } })
      await db.collection('delivery_persons').updateOne({ id: dp_id }, { $inc: { total_deliveries: 1 } })
      const doneUser = await db.collection('users').findOne({ id: compOrder.user_id })
      if (doneUser?.phone) {
        await sendWhatsApp(doneUser.phone, `FatafatDecor: Your decoration is complete! We hope you love it. Enjoy your celebration! Thank you for choosing FatafatDecor. -FatafatDecor`)
      }
      return ok({ success: true, completed_at: completedAt })
    }
    if (path[0] === 'dp' && path[1] === 'collect-payment' && method === 'POST') {
      const { order_id, dp_id, amount, method: payMethod, notes } = await request.json()
      if (!order_id || !dp_id || !amount) return err('order_id, dp_id, amount required')
      const cpOrder = await db.collection('orders').findOne({ id: order_id })
      if (!cpOrder) return err('Order not found', 404)
      const cpAssigned = (cpOrder.accepted_decorators || []).includes(dp_id) || cpOrder.delivery_person_id === dp_id
      if (!cpAssigned) return err('Not authorized for this order', 403)
      const collection = { id: uuidv4(), order_id, dp_id, amount: Number(amount), method: payMethod || 'cash', notes: notes || '', deposited: false, created_at: new Date() }
      await db.collection('dp_collections').insertOne(collection)
      await db.collection('orders').updateOne({ id: order_id }, { $set: { payment_status: 'full', remaining_collected: true, collection_method: payMethod || 'cash' } })
      const { _id, ...clean } = collection; return ok(clean)
    }
    if (path[0] === 'dp' && path[1] === 'deposit-cash' && method === 'POST') {
      const { dp_id, amount, deposit_method, reference_number } = await request.json()
      if (!dp_id || !amount) return err('dp_id, amount required')
      const deposit = { id: uuidv4(), dp_id, amount: Number(amount), deposit_method: deposit_method || 'office_cash', reference_number: reference_number || '', created_at: new Date() }
      await db.collection('dp_deposits').insertOne(deposit)
      await db.collection('dp_collections').updateMany({ dp_id, deposited: false, method: 'cash' }, { $set: { deposited: true, deposit_id: deposit.id } })
      const { _id, ...clean } = deposit; return ok(clean)
    }
    if (path[0] === 'dp' && path[1] === 'earnings' && path[2] && method === 'GET') {
      const dpId = path[2]
      const collections = await db.collection('dp_collections').find({ dp_id: dpId }).sort({ created_at: -1 }).toArray()
      const deposits = await db.collection('dp_deposits').find({ dp_id: dpId }).sort({ created_at: -1 }).toArray()
      const totalCollected = collections.reduce((s, c) => s + c.amount, 0)
      const cashCollected = collections.filter(c => c.method === 'cash').reduce((s, c) => s + c.amount, 0)
      const cashDeposited = deposits.reduce((s, d) => s + d.amount, 0)
      return ok({ total_collected: totalCollected, cash_collected: cashCollected, cash_deposited: cashDeposited, cash_pending: cashCollected - cashDeposited, recent_collections: collections.slice(0, 20).map(({ _id, ...c }) => c), recent_deposits: deposits.slice(0, 10).map(({ _id, ...d }) => d) })
    }
    if (path[0] === 'dp' && path[1] === 'update-status' && method === 'POST') {
      const { order_id, status, notes, dp_id } = await request.json()
      if (!order_id || !status || !dp_id) return err('order_id, status, dp_id required')
      const usOrder = await db.collection('orders').findOne({ id: order_id })
      if (!usOrder) return err('Order not found', 404)
      const usAssigned = (usOrder.accepted_decorators || []).includes(dp_id) || usOrder.delivery_person_id === dp_id
      if (!usAssigned) return err('Not authorized for this order', 403)
      const update = { delivery_status: status }
      if (status === 'en_route') update.en_route_at = new Date()
      if (status === 'arrived') update.arrived_at = new Date()
      if (notes) update.dp_notes = notes
      await db.collection('orders').updateOne({ id: order_id }, { $set: update })
      // SMS on status change
      const statusOrder = await db.collection('orders').findOne({ id: order_id })
      if (statusOrder) {
        const statusUser = await db.collection('users').findOne({ id: statusOrder.user_id })
        if (statusUser?.phone) {
          const msgs = {
            en_route: 'FatafatDecor: Great news! Your decorator is on the way to your location. Please be available. -FatafatDecor',
            arrived: 'FatafatDecor: Your decorator has arrived! Please open the door. Decoration will begin shortly. -FatafatDecor',
            decorating: 'FatafatDecor: Decoration work has started at your location! Sit back and relax. -FatafatDecor',
            delivered: 'FatafatDecor: Your decoration is complete! We hope you love it. Thank you for choosing FatafatDecor! -FatafatDecor',
          }
          if (msgs[status]) await sendWhatsApp(statusUser.phone, msgs[status])
        }
      }
      return ok({ success: true })
    }
    if (path[0] === 'dp' && path[1] === 'order-detail' && path[2] && method === 'GET') {
      const order = await db.collection('orders').findOne({ id: path[2] })
      if (!order) return err('Order not found', 404)
      const user = await db.collection('users').findOne({ id: order.user_id })
      const design = order.design_id ? await db.collection('designs').findOne({ id: order.design_id }) : null
      let kitInfo = null
      if (design?.kit_id) {
        const kit = await db.collection('decoration_kits').findOne({ id: design.kit_id })
        if (kit) { const { _id, reference_images, ...kitData } = kit; kitInfo = kitData }
      }
      const { _id: _1, password: _2, ...safeUser } = user || {}
      const { _id: _3, ...cleanOrder } = order
      return ok({ ...cleanOrder, customer: safeUser, decorated_image: design?.decorated_image || null, kit_name: design?.kit_name || null, kit_id: design?.kit_id || null, kit_info: kitInfo, kit_items: design?.kit_items || [], addon_items: design?.addon_items || [] })
    }

    // ── DP: Accept Order ──────────────────────────────────────────────────
    if (path[0] === 'dp' && path[1] === 'accept-order' && method === 'POST') {
      const { order_id, dp_id } = await request.json()
      if (!order_id || !dp_id) return err('order_id and dp_id required')
      const dp = await db.collection('delivery_persons').findOne({ id: dp_id })
      if (!dp) return err('Delivery person not found', 404)
      const order = await db.collection('orders').findOne({ id: order_id })
      if (!order) return err('Order not found', 404)
      if (!(order.assigned_decorators || []).includes(dp_id)) return err('Order not assigned to you', 403)
      if ((order.accepted_decorators || []).includes(dp_id)) return err('You have already accepted this order')
      const aoUpdate = { $addToSet: { accepted_decorators: dp_id } }
      if (!order.delivery_person_id) {
        aoUpdate.$set = { delivery_person_id: dp_id, delivery_status: 'assigned' }
      }
      await db.collection('orders').updateOne({ id: order_id }, aoUpdate)
      return ok({ success: true, message: 'Order accepted successfully' })
    }

    // ── DP: Decline Order ─────────────────────────────────────────────────
    if (path[0] === 'dp' && path[1] === 'decline-order' && method === 'POST') {
      const { order_id, dp_id } = await request.json()
      if (!order_id || !dp_id) return err('order_id and dp_id required')
      const order = await db.collection('orders').findOne({ id: order_id })
      if (!order) return err('Order not found', 404)
      await db.collection('orders').updateOne(
        { id: order_id },
        { $pull: { assigned_decorators: dp_id, accepted_decorators: dp_id } }
      )
      return ok({ success: true, message: 'Order declined' })
    }

    // ====== SEED ======
    if (path[0] === 'seed' && (method === 'POST' || method === 'GET')) {
      await db.collection('items').deleteMany({})
      // NOTE: delivery_persons are NOT deleted — their IDs are referenced by orders
      await db.collection('rent_items').deleteMany({})
      await db.collection('decoration_kits').deleteMany({})
      const citiesExist = await db.collection('allowed_cities').countDocuments({})
      if (citiesExist === 0) {
        await db.collection('allowed_cities').insertMany([
          { id: uuidv4(), name: 'Ranchi', state: 'Jharkhand', active: true, created_at: new Date() },
          { id: uuidv4(), name: 'Pune', state: 'Maharashtra', active: true, created_at: new Date() }
        ])
      }
      const IK = IMAGEKIT_URL
      const items = [
        { name: 'Mix Balloon Set', category: 'Balloons', type_finish: 'Mix', size: '10-12 inch', unit_cost: 16, selling_price_unit: 20.8, stock_count: 500, tags: ['birthday','party','celebration','universal'], image_url: IK+'/dataset/3-5k/balloons_mix.jpg' },
        { name: 'Transparent Confetti Balloon', category: 'Balloons', type_finish: 'Transparent', size: '10-12 inch', unit_cost: 25, selling_price_unit: 32.5, stock_count: 200, tags: ['birthday','party','celebration','universal'], image_url: IK+'/dataset/3-5k/balloons_confetti.jpg' },
        { name: 'Pink Balloon', category: 'Balloons', type_finish: 'Coloured', size: '10-12 inch', unit_cost: 8, selling_price_unit: 10.4, stock_count: 500, tags: ['birthday','baby_shower','party','universal'], image_url: IK+'/dataset/3-5k/balloons_pink.jpg' },
        { name: 'Red Balloon', category: 'Balloons', type_finish: 'Coloured', size: '10-12 inch', unit_cost: 9, selling_price_unit: 11.7, stock_count: 500, tags: ['anniversary','party','universal','romantic'], image_url: IK+'/dataset/3-5k/balloons_red.jpg' },
        { name: 'Golden Chrome Balloon', category: 'Balloons', type_finish: 'Chrome', size: '12 inch', unit_cost: 12, selling_price_unit: 15.6, stock_count: 250, tags: ['birthday','anniversary','wedding','celebration'], image_url: IK+'/dataset/3-5k/balloons_chrome_gold.jpg' },
        { name: 'Rose Gold Balloon', category: 'Balloons', type_finish: 'Chrome', size: '12 inch', unit_cost: 12, selling_price_unit: 15.6, stock_count: 250, tags: ['birthday','engagement','anniversary','celebration'], image_url: IK+'/dataset/3-5k/balloons_rose_gold.jpg' },
        { name: 'Pastel Balloon Small', category: 'Balloons', type_finish: 'Pastel', size: '10-12 inch', unit_cost: 14, selling_price_unit: 18.2, stock_count: 500, tags: ['birthday','baby_shower','party','universal'], image_url: IK+'/dataset/3-5k/balloons_pastel.jpg' },
        { name: 'Red Heart Balloon', category: 'Balloons', type_finish: 'Foil Shape', size: '12 inch', unit_cost: 60, selling_price_unit: 78, stock_count: 100, tags: ['anniversary','romantic','engagement','valentine'], image_url: IK+'/dataset/3-5k/balloons_heart_red.jpg' },
        { name: 'Transparent Balloon Large', category: 'Balloons', type_finish: 'Transparent', size: '20 inch', unit_cost: 60, selling_price_unit: 78, stock_count: 100, tags: ['birthday','party','universal'], image_url: IK+'/dataset/3-5k/balloons_transparent_large.jpg' },
        { name: 'Foil Backdrop Curtain', category: 'Backdrop', type_finish: 'Foil', size: '6ft x 4ft', unit_cost: 350, selling_price_unit: 455, stock_count: 20, tags: ['birthday','anniversary','party','celebration','universal'], image_url: IK+'/dataset/3-5k/backdrop_foil.jpg' },
        { name: 'Net Backdrop Large', category: 'Backdrop', type_finish: 'Net', size: '5m x 1.5m', unit_cost: 500, selling_price_unit: 650, stock_count: 20, tags: ['birthday','anniversary','wedding','party','universal'], image_url: IK+'/dataset/3-5k/backdrop_net.jpg' },
        { name: 'LED Curtain String', category: 'Lighting', type_finish: 'LED Curtain', size: 'Standard', unit_cost: 755, selling_price_unit: 981.5, stock_count: 15, tags: ['anniversary','romantic','wedding','dinner','universal'], image_url: IK+'/dataset/3-5k/lights_curtain.jpg' },
        { name: 'Artificial Flower Set', category: 'Floral', type_finish: 'Artificial', size: 'Standard', unit_cost: 1200, selling_price_unit: 1560, stock_count: 10, tags: ['wedding','anniversary','romantic','celebration'], image_url: IK+'/dataset/5-10k/flower_wall.jpg' },
        { name: 'Neon Sign - Happy Birthday', category: 'Neon Signs', type_finish: 'Neon', size: 'N/A', unit_cost: 2000, selling_price_unit: 2600, stock_count: 5, tags: ['birthday','celebration','party'], image_url: IK+'/dataset/5-10k/neon_custom.jpg' },
        { name: "Neon Sign - Let's Party (Pink)", category: 'Neon Signs', type_finish: 'Neon', size: 'Medium', unit_cost: 2000, selling_price_unit: 2600, stock_count: 5, tags: ['birthday','party','celebration'], image_url: IK+'/dataset/5-10k/neon_dance.jpg' },
        { name: 'Neon Sign - Good Vibes Only', category: 'Neon Signs', type_finish: 'Neon', size: 'N/A', unit_cost: 2300, selling_price_unit: 2990, stock_count: 5, tags: ['party','celebration','birthday'], image_url: IK+'/dataset/5-10k/neon_sign.jpg' },
        { name: 'Neon Sign - Bride To Be', category: 'Neon Signs', type_finish: 'Neon', size: 'N/A', unit_cost: 2000, selling_price_unit: 2600, stock_count: 5, tags: ['wedding','engagement','bride_shower'], image_url: IK+'/dataset/5-10k/neon_custom.jpg' },
        { name: 'Foil Number Balloon', category: 'Foil Balloons', type_finish: 'Foil', size: '16 inch', unit_cost: 150, selling_price_unit: 195, stock_count: 100, tags: ['birthday','anniversary','celebration'], image_url: IK+'/dataset/5-10k/marquee_letters.jpg' },
        { name: 'Foil Letter Balloon', category: 'Foil Balloons', type_finish: 'Foil', size: '32 inch', unit_cost: 200, selling_price_unit: 260, stock_count: 100, tags: ['birthday','anniversary','celebration'], image_url: IK+'/dataset/5-10k/marquee_letters.jpg' },
        { name: 'LED Pillar Candle Set (3 pcs)', category: 'Lighting', type_finish: 'LED', size: 'Set of 3', unit_cost: 400, selling_price_unit: 520, stock_count: 10, tags: ['anniversary','romantic','dinner','wedding'], image_url: IK+'/dataset/5-10k/centerpiece.jpg' },
        { name: 'Colour Net Curtain', category: 'Backdrop', type_finish: 'Net', size: '8ft x 4ft', unit_cost: 400, selling_price_unit: 520, stock_count: 20, tags: ['haldi','festival','wedding','celebration'], image_url: IK+'/dataset/3-5k/backdrop_net.jpg' },
        { name: 'Glue Dot Roll (Balloon)', category: 'Tools & Supplies', type_finish: 'Adhesive', size: 'Roll', unit_cost: 250, selling_price_unit: 325, stock_count: 50, tags: ['universal'], image_url: '' },
        { name: 'Ribbon Roll', category: 'Tools & Supplies', type_finish: 'Ribbon', size: 'Standard', unit_cost: 100, selling_price_unit: 130, stock_count: 50, tags: ['universal'], image_url: '' },
        { name: 'Tape Roll', category: 'Tools & Supplies', type_finish: 'Tape', size: 'Standard', unit_cost: 50, selling_price_unit: 65, stock_count: 100, tags: ['universal'], image_url: '' },
        { name: 'Fishing String Roll', category: 'Tools & Supplies', type_finish: 'Thread/String', size: 'Small roll', unit_cost: 400, selling_price_unit: 520, stock_count: 50, tags: ['universal'], image_url: '' },
        { name: 'Zip Tie Packet', category: 'Tools & Supplies', type_finish: 'Fasteners', size: 'N/A', unit_cost: 500, selling_price_unit: 650, stock_count: 50, tags: ['universal'], image_url: '' },
      ].map(i => ({ ...i, id: uuidv4(), price: i.selling_price_unit, active: true, created_at: new Date() }))
      await db.collection('items').insertMany(items)

      const rentItems = [
        { item_id: 'HV-0001', name: 'Happy Birthday Neon Sign LED 12x18 Inch', category: 'Lighting', rental_cost: 500, selling_price: 2600, is_sellable: true, image_url: IK+'/rentals/neon_hb.jpg' },
        { item_id: 'HV-0002', name: "Let's Party LED Neon (15x10x1 cm)", category: 'Lighting', rental_cost: 275, selling_price: 1430, is_sellable: true, image_url: IK+'/rentals/neon_lp.jpg' },
        { item_id: 'HV-0007', name: 'Alphabet LED Marquee Letter (Warm White)', category: 'Lighting', rental_cost: 75, selling_price: 390, is_sellable: true, image_url: IK+'/rentals/marquee_letter.jpg' },
        { item_id: 'HV-0011', name: 'Background Support Kit Metal Stand 9ft x 9ft', category: 'Stands', rental_cost: 625, selling_price: null, is_sellable: false, image_url: IK+'/rentals/stand_metal.jpg' },
        { item_id: 'HV-0013', name: 'Rectangle Balloon Stand (PVC) 190x210cm', category: 'Stands', rental_cost: 300, selling_price: null, is_sellable: false, image_url: IK+'/rentals/stand_rect.jpg' },
        { item_id: 'HV-0014', name: 'Round Arch Balloon Stand (PVC) 5ft x 6ft', category: 'Stands', rental_cost: 375, selling_price: null, is_sellable: false, image_url: IK+'/rentals/stand_arch.jpg' },
        { item_id: 'HV-0020', name: 'Acrylic Glass Flameless LED Candles (Pack of 3)', category: 'Lighting', rental_cost: 300, selling_price: 1560, is_sellable: true, image_url: IK+'/rentals/candles_acrylic.jpg' },
        { item_id: 'HV-0026', name: 'Artificial Silk Rose Petals (Red, 500 pcs)', category: 'Floral', rental_cost: 75, selling_price: 390, is_sellable: true, image_url: IK+'/rentals/petals_rose.jpg' },
        { item_id: 'HV-0032', name: 'Marigold Garlands (Pack of 10)', category: 'Floral', rental_cost: 125, selling_price: 650, is_sellable: true, image_url: IK+'/rentals/marigold.jpg' },
      ].map(i => ({ ...i, id: uuidv4(), qty_available: 1, active: true, created_at: new Date() }))
      await db.collection('rent_items').insertMany(rentItems)

      const kitsToInsert = [
        { kit_code: 'KTS-001', name: 'Boss Baby Blast (KTS-001)', occasion_tags: ['birthday','party','boss baby'], selling_total: 8905, purchase_total: 6850, bom: [{"item":"Latex Balloons (Mix palette)","qty":300,"uom":"pcs","unit_purchase":16.0},{"item":"Foil Backdrop Curtain Silver","qty":1,"uom":"set","unit_purchase":350},{"item":"Foil Number Balloon","qty":1,"uom":"pc","unit_purchase":400},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Boss Baby', audience: 'Kids' },
        { kit_code: 'KTS-002', name: 'Cars Speed Track (KTS-002)', occasion_tags: ['birthday','party','cars'], selling_total: 5590, purchase_total: 4300, bom: [{"item":"Latex Balloons (Red palette)","qty":250,"uom":"pcs","unit_purchase":9.0},{"item":"Foil Backdrop Curtain Red","qty":1,"uom":"set","unit_purchase":350},{"item":"Foil Number Balloon","qty":1,"uom":"pc","unit_purchase":400},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Cars', audience: 'Kids' },
        { kit_code: 'KTS-003', name: 'Cocomelon Garden Pop (KTS-003)', occasion_tags: ['birthday','party','cocomelon'], selling_total: 8905, purchase_total: 6850, bom: [{"item":"Latex Balloons (Mix palette)","qty":300,"uom":"pcs","unit_purchase":16.0},{"item":"Foil Backdrop Curtain Silver","qty":1,"uom":"set","unit_purchase":350},{"item":"Foil Number Balloon","qty":1,"uom":"pc","unit_purchase":400},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Cocomelon', audience: 'Kids' },
        { kit_code: 'KTS-004', name: 'Disney Princess Silver Gala (KTS-004)', occasion_tags: ['birthday','party','disney princess'], selling_total: 10985, purchase_total: 8450, bom: [{"item":"Latex Balloons (Mix palette)","qty":400,"uom":"pcs","unit_purchase":16.0},{"item":"Foil Backdrop Curtain Silver","qty":1,"uom":"set","unit_purchase":350},{"item":"Foil Number Balloon","qty":1,"uom":"pc","unit_purchase":400},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Disney Princess', audience: 'Kids, Girls' },
        { kit_code: 'KTS-012', name: 'Unicorn Sparkle Pastels (KTS-012)', occasion_tags: ['birthday','party','unicorn'], selling_total: 10595, purchase_total: 8150, bom: [{"item":"Latex Balloons (Pastel palette)","qty":400,"uom":"pcs","unit_purchase":14.0},{"item":"Net Backdrop White","qty":1,"uom":"set","unit_purchase":500},{"item":"Foil Backdrop Curtain Silver","qty":1,"uom":"set","unit_purchase":350},{"item":"Foil Number Balloon","qty":1,"uom":"pc","unit_purchase":400},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Unicorn', audience: 'Kids, Girls' },
        { kit_code: 'KTS-013', name: 'Newborn Naming Ceremony (KTS-013)', occasion_tags: ['ceremony','baby_shower','naming ceremony'], selling_total: 6500, purchase_total: 5000, bom: [{"item":"Latex Balloons (Mix palette)","qty":200,"uom":"pcs","unit_purchase":16.0},{"item":"Net Backdrop White","qty":1,"uom":"set","unit_purchase":500},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Naming Ceremony', audience: 'Newborn' },
        { kit_code: 'KTS-018', name: 'Candle Light Dinner Luxe (KTS-018)', occasion_tags: ['anniversary','romantic','valentine','dinner'], selling_total: 10660, purchase_total: 8200, bom: [{"item":"Fresh Roses","qty":50,"uom":"pcs","unit_purchase":50},{"item":"LED Pillar Candles Set of 3","qty":1,"uom":"set","unit_purchase":1200},{"item":"Batteries for LED candles","qty":1,"uom":"set","unit_purchase":200},{"item":"Neon Light Good Vibes Only","qty":1,"uom":"pc","unit_purchase":2300},{"item":"Red Heart Balloons 12 inch","qty":25,"uom":"pcs","unit_purchase":60.0},{"item":"Net Backdrop","qty":1,"uom":"set","unit_purchase":500}], theme: 'Candle Light Dinner', audience: 'Couple' },
        { kit_code: 'KTS-019', name: 'Romantic Room Decor (KTS-019)', occasion_tags: ['anniversary','romantic','valentine'], selling_total: 13787, purchase_total: 10605, bom: [{"item":"Latex Balloons Mix palette","qty":400,"uom":"pcs","unit_purchase":16.0},{"item":"White Net 3 pc set","qty":1,"uom":"set","unit_purchase":355},{"item":"Foil Letters I LOVE YOU 16 inch","qty":7,"uom":"pcs","unit_purchase":150},{"item":"Red Heart Balloons 12 inch","qty":25,"uom":"pcs","unit_purchase":60.0},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Romantic Room', audience: 'Couple' },
        { kit_code: 'KTS-020', name: 'Canopy Decor Premium (KTS-020)', occasion_tags: ['anniversary','romantic','wedding'], selling_total: 8983, purchase_total: 6910, bom: [{"item":"Latex Balloons Mix palette","qty":100,"uom":"pcs","unit_purchase":16.0},{"item":"White Net 3 pc set","qty":5,"uom":"sets","unit_purchase":355},{"item":"LED Curtain String","qty":1,"uom":"set","unit_purchase":755},{"item":"LED Pillar Candles Set of 3","qty":1,"uom":"set","unit_purchase":1200},{"item":"Batteries for LED candles","qty":1,"uom":"set","unit_purchase":200},{"item":"Red Latex Balloons","qty":20,"uom":"pcs","unit_purchase":9.0},{"item":"Red Heart Balloons 12 inch","qty":20,"uom":"pcs","unit_purchase":60.0}], theme: 'Canopy', audience: 'Couple' },
        { kit_code: 'KTS-022', name: 'Anniversary Classic Net (KTS-022)', occasion_tags: ['anniversary','romantic'], selling_total: 9412, purchase_total: 7240, bom: [{"item":"Latex Balloons Mix palette","qty":340,"uom":"pcs","unit_purchase":16.0},{"item":"Net Backdrop Large","qty":1,"uom":"set","unit_purchase":500},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Anniversary', audience: 'Couple' },
        { kit_code: 'KTS-023', name: 'Haldi Celebration Bloom (KTS-023)', occasion_tags: ['haldi','wedding','festival'], selling_total: 12162, purchase_total: 9355, bom: [{"item":"Latex Balloons Mix palette","qty":400,"uom":"pcs","unit_purchase":16.0},{"item":"Colour Net Curtain 8ft x 4ft","qty":1,"uom":"set","unit_purchase":400},{"item":"Net Backdrop Large","qty":1,"uom":"set","unit_purchase":500},{"item":"LED Curtain String","qty":1,"uom":"set","unit_purchase":755},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Haldi', audience: 'Family' },
        { kit_code: 'KTS-024', name: 'Proposal Net & Roses (KTS-024)', occasion_tags: ['engagement','anniversary','proposal'], selling_total: 14177, purchase_total: 10905, bom: [{"item":"Latex Balloons Mix palette","qty":300,"uom":"pcs","unit_purchase":16.0},{"item":"Fresh Roses","qty":50,"uom":"pcs","unit_purchase":50},{"item":"Net Backdrop Large","qty":1,"uom":"set","unit_purchase":500},{"item":"Foil Letters I LOVE YOU 16 inch","qty":7,"uom":"pcs","unit_purchase":150},{"item":"LED Curtain String","qty":1,"uom":"set","unit_purchase":755},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Proposal', audience: 'Couple' },
        { kit_code: 'KTS-025', name: 'Bride To Be Glow (KTS-025)', occasion_tags: ['wedding','engagement','bride shower'], selling_total: 10082, purchase_total: 7755, bom: [{"item":"Latex Balloons Pink palette","qty":400,"uom":"pcs","unit_purchase":8.0},{"item":"Neon Light Bride To Be","qty":1,"uom":"pc","unit_purchase":2000},{"item":"Net Backdrop Large","qty":1,"uom":"set","unit_purchase":500},{"item":"LED Curtain String","qty":1,"uom":"set","unit_purchase":755},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Bride To Be', audience: 'Bride' },
        { kit_code: 'KTS-026', name: 'Holi Color Blast (KTS-026)', occasion_tags: ['festival','holi','party'], selling_total: 5850, purchase_total: 4500, bom: [{"item":"Latex Balloons Mix palette","qty":200,"uom":"pcs","unit_purchase":16.0},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Holi', audience: 'Friends, Family' },
        { kit_code: 'KTS-027', name: 'Neon Party Starburst (KTS-027)', occasion_tags: ['birthday','party','neon'], selling_total: 14560, purchase_total: 11200, bom: [{"item":"Latex Balloons Mix palette","qty":400,"uom":"pcs","unit_purchase":16.0},{"item":"Net Backdrop Large","qty":1,"uom":"set","unit_purchase":500},{"item":"Star Foil Balloons","qty":6,"uom":"pcs","unit_purchase":500},{"item":"Glue Dots","qty":1,"uom":"pc","unit_purchase":250},{"item":"Tape","qty":1,"uom":"pc","unit_purchase":50},{"item":"Ribbon Roll","qty":1,"uom":"pc","unit_purchase":100},{"item":"Fishing String Roll","qty":1,"uom":"pc","unit_purchase":400},{"item":"Zip Tie Packet","qty":1,"uom":"pc","unit_purchase":500}], theme: 'Neon Party', audience: 'Any' },
      ].map(k => ({ ...k, id: uuidv4(), room_types: ['Living Room','Hall','Bedroom'], kit_items: [], reference_images: [], labor_cost: 500, travel_cost: 500, total_items_cost: k.purchase_total, final_price: k.selling_total, setup_time_minutes: 60, difficulty: k.selling_total > 12000 ? 'hard' : k.selling_total > 8000 ? 'medium' : 'easy', color_theme: '', is_active: true, active: true, notes: '', description: k.theme + ' themed decoration for ' + k.audience, created_at: new Date(), updated_at: new Date() }))
      await db.collection('decoration_kits').insertMany(kitsToInsert)

      // Upsert delivery persons by phone — preserves their IDs across re-seeds
      // This ensures orders with delivery_person_id don't become orphaned
      const dpData = [
        { name: 'Rahul Kumar', phone: '9876543210', lat: 18.5204, lng: 73.8567, rating: 4.8, total_deliveries: 156 },
        { name: 'Priya Sharma', phone: '9876543211', lat: 18.5304, lng: 73.8467, rating: 4.9, total_deliveries: 203 },
        { name: 'Amit Singh', phone: '9876543212', lat: 18.5104, lng: 73.8667, rating: 4.7, total_deliveries: 89 },
        { name: 'Neha Patel', phone: '9876543213', lat: 18.5404, lng: 73.8367, rating: 4.6, total_deliveries: 124 }
      ]
      let dpCount = 0
      for (const dp of dpData) {
        const exists = await db.collection('delivery_persons').findOne({ phone: dp.phone })
        if (!exists) {
          await db.collection('delivery_persons').insertOne({ id: uuidv4(), name: dp.name, phone: dp.phone, password: hashPwd('1234'), is_active: true, current_location: { lat: dp.lat, lng: dp.lng, updated_at: new Date() }, schedule: {}, rating: dp.rating, total_deliveries: dp.total_deliveries, created_at: new Date() })
          dpCount++
        }
      }
      const deliveryPersons = await db.collection('delivery_persons').find({}).toArray()

      const adminExists = await db.collection('users').findOne({ email: 'admin@fatafatdecor.com' })
      if (!adminExists) {
        await db.collection('users').insertOne({ id: uuidv4(), name: 'Admin', email: 'admin@fatafatdecor.com', phone: '9999999999', password: hashPwd('admin123'), role: 'admin', credits: 999, has_purchased_credits: true, location: null, auth_provider: 'email', created_at: new Date() })
      }
      return ok({ success: true, items_count: items.length, rent_items_count: rentItems.length, kits_count: kitsToInsert.length, delivery_persons_count: deliveryPersons.length, message: 'Database seeded!' })
    }

    return err(`Route /${path.join('/')} not found`, 404)
  } catch (error) {
    console.error('API Error:', error)
    return err('Internal server error: ' + error.message, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute