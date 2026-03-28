import { SignJWT, jwtVerify } from 'jose'

const getSecret = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET env var not set')
  return new TextEncoder().encode(s)
}

/** Create a signed JWT — expires in 30 days */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

/** Verify token — returns payload or null */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

/**
 * Extract user_id from Authorization: Bearer <token> header.
 * Falls back to fallbackId (body/query user_id) for backward compat with web app.
 */
export async function getUserIdFromRequest(request, fallbackId = null) {
  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) {
    const payload = await verifyToken(auth.slice(7))
    if (payload?.user_id) return payload.user_id
  }
  return fallbackId
}
