'use client'
import { useState } from 'react'

export default function DeleteAccount() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleDelete(e) {
    e.preventDefault()
    if (!confirmed) { setErrorMsg('Please tick the confirmation checkbox'); return }
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error || 'Something went wrong'); setLoading(false); return }
      setStatus('success')
    } catch {
      setErrorMsg('Network error. Please try again.')
    }
    setLoading(false)
  }

  // ── Success Screen ────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.iconBox('#D1FAE5')}>✅</div>
          <h2 style={{ ...styles.title, color: '#065F46' }}>Account Deleted</h2>
          <p style={styles.sub}>
            Your account and all associated data have been permanently deleted from FatafatDecor.
          </p>
          <div style={styles.infoBox('#F0FDF4', '#BBF7D0')}>
            <p style={{ margin: 0, fontSize: 14, color: '#166534' }}>
              ✔ Account removed<br />
              ✔ Orders data deleted<br />
              ✔ Personal information erased
            </p>
          </div>
          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
            We're sorry to see you go. You can always create a new account anytime.
          </p>
        </div>
      </div>
    )
  }

  // ── Delete Form ───────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.iconBox('#FEE2E2')}>🗑️</div>
        <h1 style={{ ...styles.title, color: '#991B1B' }}>Delete Account</h1>
        <p style={styles.sub}>
          Permanently delete your FatafatDecor account and all associated data.
        </p>

        {/* Warning Box */}
        <div style={styles.infoBox('#FFF7ED', '#FED7AA')}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#92400E', fontSize: 14 }}>
            ⚠️ This action is irreversible
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#78350F', lineHeight: 1.8 }}>
            <li>Your account will be permanently deleted</li>
            <li>All your orders history will be erased</li>
            <li>Your saved designs will be removed</li>
            <li>Your FatafatCredits will be lost</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleDelete} style={{ width: '100%' }}>
          {/* Email */}
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          {/* Password */}
          <label style={styles.label}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ ...styles.input, paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Confirm checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: '16px 0' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, accentColor: '#DC2626', flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              I understand that this action is permanent and cannot be undone. I want to delete my FatafatDecor account.
            </span>
          </label>

          {/* Error */}
          {errorMsg && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>
              ❌ {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: loading || !email || !password ? '#FCA5A5' : '#DC2626',
              color: 'white', fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.2s', marginBottom: 12
            }}
          >
            {loading ? '⏳ Deleting Account...' : '🗑️ Delete My Account'}
          </button>

          {/* Cancel link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', margin: 0 }}>
            Changed your mind?{' '}
            <a href="/" style={{ color: '#EC4899', fontWeight: 600, textDecoration: 'none' }}>
              Go back to app
            </a>
          </p>
        </form>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 24, paddingTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
            Need help instead?{' '}
            <a href="mailto:support@fatafatdecor.com" style={{ color: '#EC4899' }}>
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFF1F2 0%, #FCE7F3 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'Inter, Arial, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: 20,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  iconBox: (bg) => ({
    width: 72, height: 72, borderRadius: 18,
    background: bg, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 32, marginBottom: 16
  }),
  title: {
    fontSize: 22, fontWeight: 800,
    margin: '0 0 8px', textAlign: 'center'
  },
  sub: {
    fontSize: 14, color: '#6B7280',
    textAlign: 'center', margin: '0 0 20px',
    lineHeight: 1.6
  },
  infoBox: (bg, border) => ({
    background: bg, border: `1px solid ${border}`,
    borderRadius: 12, padding: '14px 16px',
    width: '100%', marginBottom: 20, boxSizing: 'border-box'
  }),
  label: {
    display: 'block', fontSize: 13,
    fontWeight: 600, color: '#374151',
    marginBottom: 6, marginTop: 12
  },
  input: {
    width: '100%', padding: '12px 14px',
    borderRadius: 10, border: '1.5px solid #E5E7EB',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, Arial, sans-serif',
    transition: 'border-color 0.2s',
  },
}
