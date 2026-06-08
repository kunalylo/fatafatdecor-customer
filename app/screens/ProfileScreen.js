'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  User, Zap, ShoppingBag, MapPin, Phone, Mail, ChevronRight, LogOut, X, Lock,
  Check, Loader2, Eye, EyeOff, Star, Plus, Headphones, Wand2, Gift, Edit3, Camera,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, SUPPORT_PHONE, api } from '../lib/constants'

export default function ProfileScreen() {
  const { user, setUser, userAddress, navigate, handleLogout, showToast, orders } = useApp()

  // Edit profile modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editPhoto, setEditPhoto] = useState(null)
  const [saving, setSaving] = useState(false)

  // Change password modal
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  const openEdit = () => { setEditName(user?.name || ''); setEditPhone(user?.phone || ''); setEditPhoto(null); setShowEditModal(true) }

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please pick an image file', 'error'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 256
        const scale = Math.min(MAX / img.width, MAX / img.height, 1)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        setEditPhoto(c.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => showToast('Could not read that image', 'error')
      img.src = ev.target?.result
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) { showToast('Name must be at least 2 characters', 'error'); return }
    if (editPhone && editPhone.replace(/\D/g, '').length !== 10) { showToast('Phone must be 10 digits', 'error'); return }
    setSaving(true)
    const body = { name: editName.trim() }
    if (editPhone.replace(/\D/g, '').length === 10) body.phone = editPhone.replace(/\D/g, '')
    if (editPhoto) body.photo_url = editPhoto
    const data = await api('user/profile', { method: 'PUT', body })
    if (data.error) { showToast(data.error, 'error') }
    else { setUser(prev => ({ ...prev, name: data.name, phone: data.phone, photo_url: data.photo_url || editPhoto || prev.photo_url })); showToast('Profile updated!', 'success'); setShowEditModal(false) }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!newPwd || newPwd.length < 6) { showToast('New password must be at least 6 characters', 'error'); return }
    if (newPwd !== confirmPwd) { showToast('Passwords do not match', 'error'); return }
    setChangingPwd(true)
    const data = await api('user/change-password', { method: 'POST', body: { current_password: currentPwd, new_password: newPwd } })
    if (data.error) { showToast(data.error, 'error') }
    else { showToast('Password changed successfully!', 'success'); setShowPwdModal(false); setCurrentPwd(''); setNewPwd(''); setConfirmPwd('') }
    setChangingPwd(false)
  }

  const memberSince = (() => {
    if (!user?.created_at) return null
    try { return `Joined ${new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` } catch { return null }
  })()

  const addressLine = userAddress?.flat
    ? [userAddress.flat, userAddress.area, userAddress.city].filter(Boolean).join(', ')
    : null

  return (
    <div className="min-h-screen bg-aurora pb-28 fade-in">
      {/* Sticky glass header */}
      <div className="sticky top-0 z-40 glass-overlay px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="w-10" />
          <div className="text-center">
            <p className="eyebrow text-gray-500">Your account</p>
            <h1 className="font-display text-xl font-medium text-gray-900 leading-tight">Profile</h1>
          </div>
          <button onClick={openEdit} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-gray-800" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-8 relative">
        <div className="absolute top-0 -right-20 w-56 h-56 iridescent-orb opacity-50 pointer-events-none" />

        {/* Profile info */}
        <section className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-3xl iridescent flex items-center justify-center overflow-hidden border border-white/60">
              {user?.photo_url ? <img src={user.photo_url} alt={user?.name} className="w-full h-full object-cover" /> : <span className="text-white font-display text-3xl">{(user?.name?.[0] || 'U').toUpperCase()}</span>}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full iridescent flex items-center justify-center border-2 border-white">
                <Star className="w-3 h-3 text-white fill-white" strokeWidth={0} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-pink-700 tracking-widest uppercase">Member</p>
              <h2 className="font-display text-2xl font-medium text-gray-900 truncate">{user?.name}</h2>
              {memberSince && <p className="text-[11px] text-gray-600 mt-0.5">{memberSince}</p>}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            {user?.phone && (
              <div className="flex items-center gap-2.5 text-sm text-gray-800">
                <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center"><Phone className="w-3 h-3 text-gray-700" strokeWidth={2.4} /></div>
                {user.phone}
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm text-gray-800">
              <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center"><Mail className="w-3 h-3 text-gray-700" strokeWidth={2.4} /></div>
              {user?.email}
            </div>
          </div>
        </section>

        {/* Wallet & rewards */}
        <section className="relative z-10">
          <p className="eyebrow text-gray-600 mb-3">Wallet &amp; rewards</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => navigate(SCREENS.CREDITS)} className="glass-floating rounded-[20px] p-4 text-left">
              <div className="w-10 h-10 rounded-xl iridescent flex items-center justify-center mb-2.5"><Zap className="w-4 h-4 text-white" strokeWidth={2.2} /></div>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">AI Credits</p>
              <p className="font-display text-xl font-medium text-gray-900 mt-0.5">{user?.credits || 0}</p>
            </button>
            <button onClick={() => navigate(SCREENS.ORDERS)} className="glass-floating rounded-[20px] p-4 text-left">
              <div className="w-10 h-10 rounded-xl accent-lavender flex items-center justify-center mb-2.5"><ShoppingBag className="w-4 h-4 text-white" strokeWidth={2.2} /></div>
              <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Orders</p>
              <p className="font-display text-xl font-medium text-gray-900 mt-0.5">{(orders || []).length}</p>
            </button>
          </div>
        </section>

        {/* Address book */}
        <section className="relative z-10">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="eyebrow text-gray-600">Where to deliver</p>
              <h3 className="font-display text-xl font-medium text-gray-900 leading-tight mt-1">Address book</h3>
            </div>
            <button onClick={() => navigate(SCREENS.ADDRESS)} className="flex items-center gap-1 text-[10px] font-bold text-pink-700 tracking-widest uppercase">
              <Plus className="w-3 h-3" strokeWidth={3} /> {addressLine ? 'Edit' : 'Add new'}
            </button>
          </div>
          <button onClick={() => navigate(SCREENS.ADDRESS)} className="w-full glass-floating rounded-[20px] p-3.5 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl accent-peach flex items-center justify-center flex-shrink-0"><MapPin className="w-4 h-4 text-white" strokeWidth={2.2} /></div>
            <div className="flex-1 min-w-0">
              {addressLine ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-gray-900">Home</p>
                    <span className="text-[9px] font-bold text-pink-700 tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-pink-100">Default</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-1">{addressLine}</p>
                </>
              ) : (
                <p className="text-xs font-bold text-pink-600">Tap to set your delivery address</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={2.2} />
          </button>
        </section>

        {/* Account */}
        <section className="relative z-10">
          <p className="eyebrow text-gray-600 mb-3">Account</p>
          <div className="space-y-2.5">
            <RowLink icon={Wand2} label="Buy AI Credits" desc={`${user?.credits || 0} credits left`} onClick={() => navigate(SCREENS.CREDITS)} />
            <RowLink icon={Gift} label="My Orders" desc="Decorations &amp; gifts" onClick={() => navigate(SCREENS.ORDERS)} />
            {user?.auth_provider !== 'google' && (
              <RowLink icon={Lock} label="Change Password" desc="Update your password" onClick={() => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setShowPwdModal(true) }} />
            )}
            <a href={`tel:${SUPPORT_PHONE}`} className="w-full glass-floating rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0"><Headphones className="w-4 h-4 text-gray-700" strokeWidth={2.2} /></div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-gray-900">Talk to Support</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Call {SUPPORT_PHONE}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={2.2} />
            </a>
          </div>
        </section>

        {/* Sign out */}
        <section className="relative z-10 space-y-2.5">
          <button onClick={handleLogout} className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 text-red-600 text-xs font-bold bg-white border border-red-100">
            <LogOut className="w-3.5 h-3.5" strokeWidth={2.4} /> Sign out
          </button>
          <p className="text-center text-[10px] text-gray-300 pt-1">FatafatDecor Web v2.1</p>
        </section>
      </div>

      {/* ── Edit Profile Modal (centered so Save is always visible above the nav) ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="glass-floating rounded-[28px] w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="iridescent aurora-shimmer p-6 text-center relative">
              <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/25 rounded-full flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
              <div className="relative w-24 h-24 mx-auto mb-3">
                <div className="w-24 h-24 rounded-3xl bg-white/25 flex items-center justify-center overflow-hidden border border-white/40">
                  {(editPhoto || user?.photo_url) ? <img src={editPhoto || user.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white font-display text-4xl">{(editName?.[0] || user?.name?.[0] || 'U').toUpperCase()}</span>}
                </div>
                <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer active:scale-90 transition-transform">
                  <Camera className="w-4 h-4 text-pink-600" strokeWidth={2.2} />
                  <input type="file" accept="image/*" onChange={handlePhotoPick} className="hidden" />
                </label>
              </div>
              <h2 className="text-white font-display text-2xl">Edit profile</h2>
              <p className="text-white/85 text-xs mt-0.5">Tap the camera to change your photo</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1 block">Full name</label>
                <Input placeholder="Full Name" value={editName} onChange={e => setEditName(e.target.value)} className="bg-white/70 border-white/80 h-12 rounded-2xl" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1 block">Phone</label>
                <Input placeholder="Phone (10 digits)" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="bg-white/70 border-white/80 h-12 rounded-2xl" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1 block">Email</label>
                <div className="h-12 rounded-2xl bg-gray-100/70 border border-white/60 px-4 flex items-center text-sm text-gray-500">{user?.email} <span className="ml-auto text-[10px] text-gray-400">Locked</span></div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="w-full h-12 btn-primary-luxury border-0 text-white font-bold rounded-2xl mt-1">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-4 h-4 mr-1.5" /> Save Changes</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-floating rounded-[28px] w-full max-w-sm overflow-hidden">
            <div className="iridescent aurora-shimmer p-5 text-center relative">
              <button onClick={() => setShowPwdModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/25 rounded-full flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
              <Lock className="w-8 h-8 text-white mx-auto mb-2" />
              <h2 className="text-white font-display text-xl">Change Password</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative">
                <Input placeholder="Current Password" type={showCurrentPwd ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="bg-white/70 border-white/80 h-11 rounded-2xl pr-10" />
                <button onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">{showCurrentPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}</button>
              </div>
              <div className="relative">
                <Input placeholder="New Password (min 6 chars)" type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} className="bg-white/70 border-white/80 h-11 rounded-2xl pr-10" />
                <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">{showNewPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}</button>
              </div>
              <Input placeholder="Confirm New Password" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="bg-white/70 border-white/80 h-11 rounded-2xl" />
              {newPwd && confirmPwd && newPwd !== confirmPwd && <p className="text-xs text-red-500">Passwords do not match</p>}
              <Button onClick={handleChangePassword} disabled={changingPwd || !currentPwd || !newPwd || !confirmPwd} className="w-full h-11 btn-primary-luxury border-0 text-white font-bold rounded-2xl disabled:opacity-50">
                {changingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RowLink({ icon: Icon, label, desc, onClick }) {
  return (
    <button onClick={onClick} className="w-full glass-floating rounded-2xl p-3.5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-gray-700" strokeWidth={2.2} /></div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={2.2} />
    </button>
  )
}
