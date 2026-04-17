'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Phone, Mail } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { LOGO_URL } from '../lib/constants'

export default function AuthScreen() {
  const {
    authMode, setAuthMode, loading, authForm, setAuthForm,
    signupOtpSent, setSignupOtpSent, signupOtpValue, setSignupOtpValue,
    devOtp, setDevOtp,
    loginOtpSent, setLoginOtpSent, loginOtpValue, setLoginOtpValue, loginDevOtp, setLoginDevOtp,
    showToast, handleGoogleAuth, handleAuth,
    handleSendSignupOtp, handleVerifySignupOtp,
    handleSendLoginOtp, handleVerifyLoginOtp,
  } = useApp()

  // 'password' | 'otp'  — which login method is shown
  const [loginMethod, setLoginMethod] = useState('password')

  const [otpCooldown, setOtpCooldown] = useState(0)
  const cooldownRef = useRef(null)

  const [loginOtpCooldown, setLoginOtpCooldown] = useState(0)
  const loginCooldownRef = useRef(null)

  const handleSendSignupOtpWithCooldown = async () => {
    if (otpCooldown > 0) return
    const success = await handleSendSignupOtp()
    if (!success) return
    setOtpCooldown(60)
    cooldownRef.current = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendLoginOtpWithCooldown = async () => {
    if (loginOtpCooldown > 0) return
    const success = await handleSendLoginOtp()
    if (!success) return
    setLoginOtpCooldown(60)
    loginCooldownRef.current = setInterval(() => {
      setLoginOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(loginCooldownRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    if (loginCooldownRef.current) clearInterval(loginCooldownRef.current)
  }, [])

  // Reset OTP state when switching tabs / methods
  const switchTab = (m) => {
    setAuthMode(m)
    setSignupOtpSent(false); setSignupOtpValue(''); setDevOtp('')
    setLoginOtpSent(false); setLoginOtpValue(''); setLoginDevOtp('')
  }
  const switchLoginMethod = (m) => {
    setLoginMethod(m)
    setLoginOtpSent(false); setLoginOtpValue(''); setLoginDevOtp('')
  }

  return (
    <div className="min-h-screen bg-rose-50 fade-in flex flex-col">

      {/* ── Pink hero — compact ── */}
      <div className="gradient-pink pt-10 pb-6 px-6 text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-4 border-white/40 shadow-2xl relative z-10">
          <img src={LOGO_URL} alt="FatafatDecor" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-white text-xl font-black tracking-tight relative z-10">FatafatDecor</h1>
        <p className="text-white/80 text-xs mt-0.5 relative z-10">✨ AI-powered decoration at your doorstep</p>
        <div className="flex justify-center gap-3 mt-2 relative z-10">
          {['🎀', '🎊', '🌸', '💐', '🎉'].map((e, i) => (
            <span key={i} className="text-lg opacity-80">{e}</span>
          ))}
        </div>
      </div>

      {/* ── Card overlapping hero ── */}
      <div className="flex-1 flex flex-col items-center px-4 -mt-6 pb-8">
        <Card className="w-full max-w-sm border border-pink-100 shadow-xl shadow-pink-100/60 rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-5 space-y-3">

            {/* Login / Sign Up tabs */}
            <div className="flex gap-2 mb-1">
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => switchTab(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${authMode === m ? 'gradient-pink text-white shadow-pink' : 'bg-gray-50 text-gray-400'}`}>
                  {m === 'login' ? '🔑 Login' : '🌟 Sign Up'}
                </button>
              ))}
            </div>

            {/* ===== LOGIN ===== */}
            {authMode === 'login' && (
              <>
                {/* Email / OTP sub-toggle */}
                <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl">
                  <button onClick={() => switchLoginMethod('password')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${loginMethod === 'password' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400'}`}>
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button onClick={() => switchLoginMethod('otp')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${loginMethod === 'otp' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400'}`}>
                    <Phone className="w-3.5 h-3.5" /> OTP
                  </button>
                </div>

                {/* Email + Password */}
                {loginMethod === 'password' && (
                  <>
                    <Input placeholder="Email" type="email" value={authForm.email}
                      onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
                      className="bg-gray-50 border-gray-200 h-11 rounded-xl" />
                    <Input placeholder="Password" type="password" value={authForm.password}
                      onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
                      className="bg-gray-50 border-gray-200 h-11 rounded-xl" />
                    <Button onClick={handleAuth} disabled={loading}
                      className="w-full h-11 gradient-pink border-0 text-white font-bold text-sm rounded-xl shadow-pink">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login →'}
                    </Button>
                  </>
                )}

                {/* Phone OTP */}
                {loginMethod === 'otp' && (
                  <>
                    <Input placeholder="Phone Number (10 digits)" type="tel" value={authForm.phone}
                      onChange={e => setAuthForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      className="bg-gray-50 border-gray-200 h-11 rounded-xl" />
                    <Button onClick={handleSendLoginOtpWithCooldown} disabled={loading || loginOtpCooldown > 0}
                      className="w-full h-10 gradient-pink border-0 text-white font-semibold text-sm rounded-xl shadow-pink disabled:opacity-60">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : loginOtpCooldown > 0 ? `Resend in ${loginOtpCooldown}s` : loginOtpSent ? 'Resend OTP' : '📱 Send OTP'}
                    </Button>
                    {loginOtpSent && (
                      <>
                        {loginDevOtp && process.env.NODE_ENV === 'development' && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                            <p className="text-xs text-amber-600 font-medium mb-1">⚙️ Dev Mode — OTP</p>
                            <p className="text-2xl font-bold tracking-[0.4em] text-amber-800">{loginDevOtp}</p>
                          </div>
                        )}
                        <Input placeholder="Enter 6-digit OTP" value={loginOtpValue}
                          onChange={e => setLoginOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6} className="bg-gray-50 border-gray-200 h-11 rounded-xl text-center text-lg tracking-widest" />
                        <Button onClick={handleVerifyLoginOtp} disabled={loading || !loginOtpValue}
                          className="w-full h-11 gradient-pink border-0 text-white font-bold text-sm rounded-xl shadow-pink disabled:opacity-50">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '🔑 Verify & Login'}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* ===== SIGN UP ===== */}
            {authMode === 'register' && (
              <>
                <Input placeholder="Full Name" value={authForm.name}
                  onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))}
                  className="bg-gray-50 border-gray-200 h-11 rounded-xl" />
                <Input placeholder="Phone Number (10 digits)" type="tel" value={authForm.phone}
                  onChange={e => setAuthForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="bg-gray-50 border-gray-200 h-11 rounded-xl" />
                <Button onClick={handleSendSignupOtpWithCooldown} disabled={loading || otpCooldown > 0}
                  className="w-full h-10 gradient-pink border-0 text-white font-semibold text-sm rounded-xl shadow-pink disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : signupOtpSent ? 'Resend OTP' : '📱 Send OTP'}
                </Button>
                {signupOtpSent && (
                  <>
                    {devOtp && process.env.NODE_ENV === 'development' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                        <p className="text-xs text-amber-600 font-medium mb-1">⚙️ Dev Mode — OTP</p>
                        <p className="text-2xl font-bold tracking-[0.4em] text-amber-800">{devOtp}</p>
                      </div>
                    )}
                    <Input placeholder="Enter 6-digit OTP" value={signupOtpValue}
                      onChange={e => setSignupOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6} className="bg-gray-50 border-gray-200 h-11 rounded-xl text-center text-lg tracking-widest" />
                    <Input placeholder="Email" type="email" value={authForm.email}
                      onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
                      className="bg-gray-50 border-gray-200 h-11 rounded-xl" />
                    <Input placeholder="Password" type="password" value={authForm.password}
                      onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
                      className="bg-gray-50 border-gray-200 h-11 rounded-xl" />
                    <Button onClick={handleVerifySignupOtp} disabled={loading || !signupOtpValue}
                      className="w-full h-11 gradient-pink border-0 text-white font-bold text-sm rounded-xl shadow-pink disabled:opacity-50">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '🌟 Create Account'}
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Google */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <button onClick={handleGoogleAuth} disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

          </CardContent>
        </Card>

        <p className="text-center text-gray-400 text-xs mt-4 px-4">
          By continuing, you agree to our{' '}
          <span className="text-pink-500 font-semibold">Terms & Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
