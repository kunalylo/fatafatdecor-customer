'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, IndianRupee, Camera, Trash2, Zap, X, Image as ImageIcon, Upload, Shield, Phone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { BUDGET_BRACKETS, ROOM_TYPES, OCCASIONS, SCREENS, SUPPORT_PHONE } from '../lib/constants'

export default function UploadScreen() {
  const { user, uploadForm, setUploadForm, originalImage, setOriginalImage, loading, goBack, navigate, handleGenerate, handleFileUpload, showToast, liveBrackets } = useApp()
  // Use live brackets from backend when available; static list while loading
  const brackets = (liveBrackets && liveBrackets.length > 0) ? liveBrackets : BUDGET_BRACKETS
  const [showCreditsModal, setShowCreditsModal] = useState(false)

  const handleDecorateClick = () => {
    if (!originalImage) { showToast('Please upload or take a photo of your space first!', 'error'); return }
    if (!uploadForm.budget) { showToast('Please select a budget bracket', 'error'); return }
    if ((user?.credits || 0) <= 0) { setShowCreditsModal(true); return }
    handleGenerate()
  }

  return (
  <div className="slide-up pb-28 bg-aurora-soft min-h-screen">

    {/* No Credits Popup */}
    {showCreditsModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-floating rounded-[28px] w-full max-w-sm overflow-hidden">
          <div className="iridescent aurora-shimmer p-6 text-center relative">
            <button onClick={() => setShowCreditsModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/25 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="w-16 h-16 bg-white/25 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-white font-display text-2xl">No credits left</h2>
            <p className="text-white/85 text-sm mt-1">You need credits to create decor previews</p>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-gray-500 text-sm text-center">Top up to keep previewing your space with AI.</p>
            <Button
              onClick={() => { setShowCreditsModal(false); navigate(SCREENS.CREDITS) }}
              className="w-full h-12 btn-primary-luxury border-0 text-white font-bold rounded-2xl">
              <Zap className="w-4 h-4 mr-2" /> Top Up Credits
            </Button>
            <Button
              onClick={() => setShowCreditsModal(false)}
              variant="outline"
              className="w-full h-10 border-white/70 bg-white/50 text-gray-500 rounded-2xl text-sm">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )}

    <div className="flex items-center gap-3 p-4 pt-6">
      <button onClick={goBack} className="w-9 h-9 rounded-full glass-card flex items-center justify-center">
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>
      <div>
        <p className="eyebrow text-gray-400">AI Studio</p>
        <h1 className="font-display text-2xl text-gray-900 leading-tight">Create <span className="italic iridescent-text">decoration</span></h1>
      </div>
    </div>
    <div className="px-4 space-y-4">
      {/* Occasion - FIRST */}
      <div className="glass-floating rounded-[22px] p-4">
        <label className="text-sm font-semibold block text-gray-800">Choose your occasion</label>
        <p className="text-xs text-gray-400 mb-3">What are we celebrating today?</p>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map(o => (
            <button key={o} onClick={() => setUploadForm(p => ({ ...p, occasion: o }))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${uploadForm.occasion === o ? 'btn-primary-luxury text-white' : 'bg-white/60 text-gray-500 border border-white/80'}`}>
              {o.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Selection */}
      <div className="glass-floating rounded-[22px] p-4">
        <label className="text-sm font-semibold flex items-center gap-1.5 text-gray-800">
          <IndianRupee className="w-4 h-4 text-pink-500" /> Pick your budget <span className="text-pink-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-3">Choose your budget and our AI will design within it.</p>
        <div className="grid grid-cols-2 gap-2">
          {brackets.map(b => (
            <button key={b.id} onClick={() => setUploadForm(p => ({ ...p, budget: b.id }))}
              className={`py-2.5 px-3 rounded-2xl text-left transition-all relative ${
                uploadForm.budget === b.id ? 'btn-primary-luxury text-white' :
                'bg-white/60 text-gray-600 border border-white/80 hover:border-pink-300'
              }`}>
              <p className="text-xs font-bold">{b.label}</p>
              {b.min <= 3000 && <span className="text-[9px] opacity-70">Starter</span>}
              {b.min === 10000 && <span className="text-[9px] opacity-70">Popular</span>}
              {b.min >= 50000 && <span className="text-[9px] opacity-70">Premium</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Room Photo */}
      <div className="glass-floating rounded-[22px] p-4">
        <label className="text-sm font-semibold mb-1 flex items-center gap-1.5 text-gray-800">
          <Camera className="w-4 h-4 text-pink-500" /> Upload your room photo <span className="text-pink-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">We&apos;ll use your room photo to create a decor preview.</p>
        <div className="mb-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-[11px] text-amber-700 leading-relaxed">
            <strong>For the best result:</strong> stand back and capture the <strong>full wall or corner</strong> you want decorated — include some floor and ceiling. Avoid close-ups of curtains/windows and photos of screens.
          </p>
        </div>
        <div className="relative">
          {originalImage ? (
            <div className="relative">
              <img src={originalImage} alt="Room" className="w-full h-48 object-cover rounded-2xl border border-white/80" />
              <button onClick={() => setOriginalImage(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full border-2 border-dashed border-pink-200 rounded-2xl bg-gradient-to-b from-pink-50/70 to-white/40 pt-6 pb-5 px-4">
              <div className="w-14 h-14 rounded-full gradient-pink flex items-center justify-center shadow-pink mb-3">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-bold text-gray-700">Add your room photo</p>
              <p className="text-[11px] text-gray-400 mb-4">Well-lit photo of the full wall or corner</p>
              <div className="flex gap-3 w-full max-w-xs">
                <label className="flex-1 h-11 gradient-pink text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-pink active:scale-95 transition-transform">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <label className="flex-1 h-11 bg-white border-2 border-pink-300 text-pink-500 font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-pink-50 active:scale-95 transition-transform">
                  <Camera className="w-4 h-4" /> Take Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Room Type */}
      <div className="glass-floating rounded-[22px] p-4">
        <label className="text-sm font-semibold mb-2 block text-gray-800">Room type</label>
        <select value={uploadForm.room_type} onChange={e => setUploadForm(p => ({ ...p, room_type: e.target.value }))}
          className="w-full h-12 bg-white/70 rounded-2xl px-4 text-gray-700 border border-white/80 outline-none focus:border-pink-400">
          {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Special request */}
      <div className="glass-floating rounded-[22px] p-4">
        <label className="text-sm font-semibold mb-2 block text-gray-800">Special request (optional)</label>
        <textarea value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Example: This is my kid's 4th birthday. I want a pastel balloon setup with a cute photo corner."
          className="w-full h-20 bg-white/70 rounded-2xl p-3 text-gray-700 border border-white/80 outline-none resize-none text-sm placeholder:text-gray-300 focus:border-pink-400" />
      </div>

      {/* Trust microcopy */}
      <div className="flex items-start gap-2.5 px-1">
        <Shield className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
        <p className="text-[11px] text-gray-600 leading-relaxed">
          Your photo is used only to create your decor preview.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <span>Uses 1 credit. You have <strong className="text-gray-700">{user?.credits || 0}</strong> credits.</span>
      </div>

      {/* Need help */}
      <a href={`https://wa.me/91${SUPPORT_PHONE}`} target="_blank" rel="noreferrer"
        className="w-full glass-floating rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl accent-mint flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-900">Need help?</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Talk to Support</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-pink-600 tracking-widest uppercase">Chat</span>
      </a>

      <Button onClick={handleDecorateClick} disabled={loading}
        className="w-full h-14 btn-primary-luxury border-0 text-white font-bold text-base rounded-2xl disabled:opacity-40">
        Create My AI Decor
      </Button>
    </div>
  </div>
  )
}
