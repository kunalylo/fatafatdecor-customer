'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const STEPS = [
  { at: 0,  msg: 'Picking the best kit for your budget…' },
  { at: 8,  msg: 'Selecting decoration items & colours…' },
  { at: 18, msg: 'Building your decoration scene…' },
  { at: 30, msg: 'AI is painting your room…' },
  { at: 50, msg: 'Adding flowers, lights & finishing touches…' },
  { at: 70, msg: 'Polishing the final image…' },
  { at: 90, msg: 'Almost ready — hang tight!' },
]

export default function GeneratingScreen() {
  const { uploadForm } = useApp()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Current step message
  const currentStep = [...STEPS].reverse().find(s => elapsed >= s.at) || STEPS[0]

  // Progress: moves smoothly up to 95% over 120 seconds, then holds
  const progress = Math.min(Math.round((elapsed / 120) * 95), 95)

  // Time display
  const mins  = Math.floor(elapsed / 60)
  const secs  = elapsed % 60
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      {/* Animated icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 gradient-pink rounded-3xl flex items-center justify-center pulse-glow-pink">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -inset-4 border-2 border-pink-200 rounded-[2rem] animate-ping" />
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-1">Decorating Your Space</h2>
      <p className="text-gray-400 text-sm text-center mb-1">
        AI is designing your {uploadForm?.room_type || 'room'} for{' '}
        <span className="capitalize">{uploadForm?.occasion?.replace('_', ' ') || 'your occasion'}</span>
      </p>

      {/* Step message */}
      <p className="text-pink-500 text-xs text-center font-semibold mb-5 h-4 transition-all">
        {currentStep.msg}
      </p>

      {/* Progress bar */}
      <div className="w-72 h-2.5 bg-pink-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full gradient-pink rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress stats */}
      <div className="flex items-center justify-between w-72">
        <span className="text-xs text-gray-400">{progress}%</span>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Tip — shown after 20 seconds */}
      {elapsed >= 20 && (
        <p className="text-[11px] text-gray-300 text-center mt-4 max-w-[260px] leading-relaxed fade-in">
          AI image generation takes 30–90 seconds.<br />Please don't close the app.
        </p>
      )}
    </div>
  )
}
