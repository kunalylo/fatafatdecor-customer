'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function AuthScreen() {
  const {
    authMode, setAuthMode, loading, authForm, setAuthForm,
    signupOtpSent, setSignupOtpSent, signupOtpValue, setSignupOtpValue,
    devOtp, setDevOtp, showToast, handleGoogleAuth, handleAuth,
    handleSendSignupOtp, handleVerifySignupOtp
  } = useApp()

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 fade-in">
      <div className="mb-8 text-center">
        <img
          src="/icons/icon-512.png"
          alt="FatafatDecor icon"
          className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-pink"
        />
        <h1 className="text-3xl font-extrabold text-gradient-pink mb-1">FatafatDecor</h1>
        <p className="text-gray-400 text-sm">Instant Decoration at Your Doorstep</p>
      </div>

      <Card className="w-full max-w-sm border border-gray-100 shadow-lg shadow-pink-100/50">
        <CardContent className="p-6 space-y-4">

          {/* Login / Sign Up tabs */}
          <div className="flex gap-2 mb-4">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => {
                setAuthMode(m)
                setSignupOtpSent(false); setSignupOtpValue(''); setDevOtp('')
              }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${authMode === m ? 'gradient-pink text-white shadow-pink' : 'bg-gray-50 text-gray-400'}`}>
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ===== LOGIN ===== */}
          {authMode === 'login' && (
            <>
              <Input placeholder="Email" type="email" value={authForm.email}
                onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
                className="bg-gray-50 border-gray-200 h-12 rounded-xl" />
              <Input placeholder="Password" type="password" value={authForm.password}
                onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
                className="bg-gray-50 border-gray-200 h-12 rounded-xl" />
              <Button onClick={handleAuth} disabled={loading}
                className="w-full h-12 gradient-pink border-0 text-white font-bold text-base rounded-xl shadow-pink">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </Button>
            </>
          )}

          {/* ===== SIGN UP ===== */}
          {authMode === 'register' && (
            <>
              <Input placeholder="Full Name" value={authForm.name}
                onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))}
                className="bg-gray-50 border-gray-200 h-12 rounded-xl" />
              <Input placeholder="Phone Number (10 digits)" type="tel" value={authForm.phone}
                onChange={e => setAuthForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                className="bg-gray-50 border-gray-200 h-12 rounded-xl" />
              <Button onClick={handleSendSignupOtp} disabled={loading}
                className="w-full h-10 gradient-pink border-0 text-white font-semibold text-sm rounded-xl shadow-pink">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : signupOtpSent ? 'Resend OTP' : 'Send OTP'}
              </Button>
              {signupOtpSent && (
                <>
                  {devOtp && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <p className="text-xs text-amber-600 font-medium mb-1">Dev Mode — OTP</p>
                      <p className="text-2xl font-bold tracking-[0.4em] text-amber-800">{devOtp}</p>
                    </div>
                  )}
                  <Input placeholder="Enter 6-digit OTP" value={signupOtpValue}
                    onChange={e => setSignupOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6} className="bg-gray-50 border-gray-200 h-12 rounded-xl text-center text-lg tracking-widest" />
                  <Input placeholder="Email" type="email" value={authForm.email}
                    onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))}
                    className="bg-gray-50 border-gray-200 h-12 rounded-xl" />
                  <Input placeholder="Password" type="password" value={authForm.password}
                    onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))}
                    className="bg-gray-50 border-gray-200 h-12 rounded-xl" />
                  <Button onClick={handleVerifySignupOtp} disabled={loading || !signupOtpValue}
                    className="w-full h-12 gradient-pink border-0 text-white font-bold text-base rounded-xl shadow-pink disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  </Button>
                </>
              )}
            </>
          )}

          {/* Google */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button onClick={handleGoogleAuth} disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 shadow-sm">
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
    </div>
  )
}
