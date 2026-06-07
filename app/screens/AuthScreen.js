'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Phone, Mail, Sparkles, Gift, Wand2 } from 'lucide-react'
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

  // Shared aurora input styling
  const inputCls = 'h-12 rounded-2xl bg-white/70 border-white/80 focus-visible:ring-pink-300/60 shadow-sm placeholder:text-gray-400'

  return (
    <div className="min-h-screen bg-aurora fade-in flex flex-col relative overflow-hidden">
      {/* Ambient iridescent orbs */}
      <div className="iridescent-orb absolute -top-10 -left-10 w-44 h-44 rounded-full pointer-events-none" />
      <div className="iridescent-orb absolute top-24 -right-12 w-40 h-40 rounded-full pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* ── Editorial hero ── */}
      <div className="pt-14 pb-6 px-6 text-center relative z-10">
        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border border-white/70 shadow-xl glass-icon">
          <img src={LOGO_URL} alt="FatafatDecor" className="w-full h-full object-cover" />
        </div>
        <p className="eyebrow text-gray-500 mb-1">AI Decoration Studio</p>
        <h1 className="font-display text-4xl text-gray-900 leading-tight">
          Fatafat <span className="italic iridescent-text">Decor</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">Your space, beautifully decorated — delivered to your door.</p>
        <div className="flex justify-center gap-5 mt-4 text-gray-400">
          <span className="flex flex-col items-center gap-1 text-[10px] font-semibold"><Wand2 className="w-4 h-4 text-pink-400" /> Design</span>
          <span className="flex flex-col items-center gap-1 text-[10px] font-semibold"><Sparkles className="w-4 h-4 text-violet-400" /> AI Preview</span>
          <span className="flex flex-col items-center gap-1 text-[10px] font-semibold"><Gift className="w-4 h-4 text-amber-400" /> Gifts</span>
        </div>
      </div>

      {/* ── Glass auth card ── */}
      <div className="flex-1 flex flex-col items-center px-4 pb-10 relative z-10">
        <Card className="w-full max-w-sm border-0 glass-floating rounded-[28px] overflow-hidden">
          <CardContent className="p-5 space-y-3">

            {/* Login / Sign Up tabs */}
            <div className="flex gap-1.5 p-1 rounded-2xl bg-white/50 border border-white/70 mb-1">
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => switchTab(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${authMode === m ? 'btn-primary-luxury' : 'text-gray-500'}`}>
                  {m === 'login' ? 'Login' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* ===== LOGIN ===== */}
            {authMode === 'login' && (
              <>
                {/* Email / OTP sub-toggle */}
                <div className="flex gap-1.5 bg-white/50 border border-white/70 p-1 rounded-2xl">
                  <button onClick={() => switchLoginMethod('password')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${loginMethod === 'password' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button onClick={() => switchLoginMethod('otp')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${loginMethod === 'otp' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}>
                    <Phone className="w-3.5 h-3.5" /> OTP
                  </button>
                </div>

                {/* Email + Password */}
                {loginMethod === 'password' && (
                  <>
                    <Input placeholder="Email" type="email" value={authForm.email}
                      onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
                      className={inputCls} />
                    <Input placeholder="Password" type="password" value={authForm.password}
                      onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
                      className={inputCls} />
                    <Button onClick={handleAuth} disabled={loading}
                      className="w-full h-12 btn-primary-luxury border-0 text-white font-bold text-sm rounded-2xl">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
                    </Button>
                  </>
                )}

                {/* Phone OTP */}
                {loginMethod === 'otp' && (
                  <>
                    <Input placeholder="Phone Number (10 digits)" type="tel" value={authForm.phone}
                      onChange={e => setAuthForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      className={inputCls} />
                    <Button onClick={handleSendLoginOtpWithCooldown} disabled={loading || loginOtpCooldown > 0}
                      className="w-full h-11 btn-primary-luxury border-0 text-white font-semibold text-sm rounded-2xl disabled:opacity-60">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : loginOtpCooldown > 0 ? `Resend in ${loginOtpCooldown}s` : loginOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </Button>
                    {loginOtpSent && (
                      <>
                        {loginDevOtp && process.env.NODE_ENV === 'development' && (
                          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-center">
                            <p className="text-xs text-amber-600 font-medium mb-1">Dev Mode — OTP</p>
                            <p className="text-2xl font-bold tracking-[0.4em] text-amber-800">{loginDevOtp}</p>
                          </div>
                        )}
                        <Input placeholder="Enter 6-digit OTP" value={loginOtpValue}
                          onChange={e => setLoginOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6} className={`${inputCls} text-center text-lg tracking-widest`} />
                        <Button onClick={handleVerifyLoginOtp} disabled={loading || !loginOtpValue}
                          className="w-full h-12 btn-primary-luxury border-0 text-white font-bold text-sm rounded-2xl disabled:opacity-50">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
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
                  className={inputCls} />
                <Input placeholder="Phone Number (10 digits)" type="tel" value={authForm.phone}
                  onChange={e => setAuthForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className={inputCls} />
                <Button onClick={handleSendSignupOtpWithCooldown} disabled={loading || otpCooldown > 0}
                  className="w-full h-11 btn-primary-luxury border-0 text-white font-semibold text-sm rounded-2xl disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : signupOtpSent ? 'Resend OTP' : 'Send OTP'}
                </Button>
                {signupOtpSent && (
                  <>
                    {devOtp && process.env.NODE_ENV === 'development' && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-center">
                        <p className="text-xs text-amber-600 font-medium mb-1">Dev Mode — OTP</p>
                        <p className="text-2xl font-bold tracking-[0.4em] text-amber-800">{devOtp}</p>
                      </div>
                    )}
                    <Input placeholder="Enter 6-digit OTP" value={signupOtpValue}
                      onChange={e => setSignupOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6} className={`${inputCls} text-center text-lg tracking-widest`} />
                    <Input placeholder="Email" type="email" value={authForm.email}
                      onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
                      className={inputCls} />
                    <Input placeholder="Password" type="password" value={authForm.password}
                      onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
                      className={inputCls} />
                    <Button onClick={handleVerifySignupOtp} disabled={loading || !signupOtpValue}
                      className="w-full h-12 btn-primary-luxury border-0 text-white font-bold text-sm rounded-2xl disabled:opacity-50">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Google */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200/70" />
              <span className="text-xs text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200/70" />
            </div>
            <button onClick={handleGoogleAuth} disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 border border-white/80 rounded-2xl bg-white/70 hover:bg-white transition-all text-sm font-semibold text-gray-700 shadow-sm">
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
          <span className="text-pink-500 font-semibold">Terms &amp; Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
