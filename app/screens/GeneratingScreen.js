'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function GeneratingScreen() {
  const { uploadForm } = useApp()
  const [elapsed, setElapsed] = useState(0)
  const STEPS = ['Picking the best kit for your budget...', 'Selecting decoration items...', 'Building your colour palette...', 'Composing the scene...', 'AI is painting your room...', 'Adding finishing touches...', 'Almost ready...']
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const step = STEPS[Math.min(Math.floor(elapsed / 8), STEPS.length - 1)]
  const progress = Math.min(Math.round((elapsed / 55) * 100), 99)
  return (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-aurora relative overflow-hidden">
    <div className="iridescent-orb absolute top-24 -left-10 w-44 h-44 rounded-full pointer-events-none" />
    <div className="iridescent-orb absolute bottom-24 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ animationDelay: '2s' }} />

    <div className="relative mb-8 z-10">
      <div className="w-24 h-24 iridescent aurora-shimmer rounded-[28px] flex items-center justify-center premium-pulse border border-white/60">
        <Sparkles className="w-12 h-12 text-white drop-shadow" />
      </div>
      <div className="absolute -inset-4 border-2 border-pink-200/70 rounded-[2.2rem] animate-ping" />
    </div>
    <p className="eyebrow text-pink-400 mb-1 z-10">AI Studio</p>
    <h2 className="font-display text-2xl text-gray-900 mb-2 z-10">Decorating your <span className="italic iridescent-text">space</span></h2>
    <p className="text-gray-500 text-sm text-center mb-1 z-10">AI is designing your {uploadForm?.room_type || 'room'}...</p>
    <p className="text-pink-500 text-xs text-center font-medium mb-4 h-4 transition-all z-10">{step}</p>
    <div className="w-64 h-2 bg-white/60 rounded-full overflow-hidden z-10">
      <div className="h-full iridescent rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
    </div>
    <div className="flex items-center justify-between w-64 mt-2 z-10">
      <span className="text-xs text-gray-400">{progress}%</span>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
        <span>{elapsed}s</span>
      </div>
    </div>
  </div>
)
}
