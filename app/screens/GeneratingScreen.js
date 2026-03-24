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
  const step = STEPS[Math.min(Math.floor(elapsed / 2), STEPS.length - 1)]
  const progress = Math.min(Math.round((elapsed / 15) * 100), 99)
  return (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
    <div className="relative mb-8">
      <div className="w-24 h-24 gradient-pink rounded-3xl flex items-center justify-center pulse-glow-pink">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
      <div className="absolute -inset-4 border-2 border-pink-200 rounded-[2rem] animate-ping" />
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2">Decorating Your Space</h2>
    <p className="text-gray-400 text-sm text-center mb-1">AI is designing your {uploadForm?.room_type || 'room'}...</p>
    <p className="text-pink-400 text-xs text-center font-medium mb-4 h-4 transition-all">{step}</p>
    <div className="w-64 h-2 bg-pink-100 rounded-full overflow-hidden">
      <div className="h-full gradient-pink rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
    </div>
    <div className="flex items-center justify-between w-64 mt-2">
      <span className="text-xs text-gray-400">{progress}%</span>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
        <span>{elapsed}s</span>
      </div>
    </div>
  </div>
)
}
