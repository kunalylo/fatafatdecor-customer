'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Zap, ShoppingBag, MapPin, Phone, ChevronRight, LogOut, Pencil, X, Lock, Check, Loader2, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, SUPPORT_PHONE, api } from '../lib/constants'

export default function ProfileScreen() {
  const { user, setUser, userAddress, navigate, handleLogout, showToast, loading, orders } = useApp()

  // Edit profile state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)

  // Change password state
  const [showPwdModal, setShowPwdModal] = useState(false)
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  const startEditing = () => {
    setEditName(user?.name || '')
    setEditPhone(user?.phone || '')
    setEditing(true)
  }

  const cancelEditing = () => { setEditing(false) }

  const saveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) { showToast('Name must be at least 2 characters', 'error'); return }
    if (editPhone && editPhone.replace(/\D/g, '').length !== 10) { showToast('Phone must be 10 digits', 'error'); return }
    setSaving(true)
    const body = { name: editName.trim() }
    if (editPhone.replace(/\D/g, '').length === 10) body.phone = editPhone.replace(/\D/g, '')
    const data = await api('user/profile', { method: 'PUT', body })
    if (data.error) { showToast(data.error, 'error') }
    else {
      // setUser triggers the AppContext effect that persists the fresh user to localStorage —
      // don't write it here from a stale `user` closure (that could clobber recent credit updates).
      setUser(prev => ({ ...prev, name: data.name, phone: data.phone }))
      showToast('Profile updated!', 'success')
      setEditing(false)
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!newPwd || newPwd.length < 6) { showToast('New password must be at least 6 characters', 'error'); return }
    if (newPwd !== confirmPwd) { showToast('Passwords do not match', 'error'); return }
    setChangingPwd(true)
    const data = await api('user/change-password', { method: 'POST', body: { current_password: currentPwd, new_password: newPwd } })
    if (data.error) { showToast(data.error, 'error') }
    else {
      showToast('Password changed successfully!', 'success')
      setShowPwdModal(false)
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    }
    setChangingPwd(false)
  }

  return (
  <div className="slide-up pb-28 bg-aurora min-h-screen relative overflow-hidden">
    <div className="iridescent-orb absolute -top-10 -right-12 w-44 h-44 rounded-full pointer-events-none" />
    <div className="relative z-10">
      <div className="p-4 pt-12">
        <p className="eyebrow text-gray-400">Account</p>
        <h1 className="font-display text-3xl text-gray-900 leading-tight">Profile</h1>
      </div>
      <div className="px-4 space-y-4">

        {/* User Info */}
        <div className="glass-floating rounded-[26px] p-6">
          {!editing ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full iridescent flex items-center justify-center border border-white/60 shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl text-gray-900 truncate leading-tight">{user?.name}</h2>
                <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                {user?.phone && <p className="text-xs text-gray-400 mt-0.5">{user?.phone}</p>}
              </div>
              <button onClick={startEditing} className="w-9 h-9 rounded-full bg-white/80 border border-white/80 flex items-center justify-center shrink-0 hover:bg-white">
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm text-gray-800">Edit Profile</h3>
                <button onClick={cancelEditing} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <Input placeholder="Full Name" value={editName} onChange={e => setEditName(e.target.value)}
                className="bg-white/70 border-white/80 h-11 rounded-2xl" />
              <Input placeholder="Phone (10 digits)" type="tel" value={editPhone}
                onChange={e => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="bg-white/70 border-white/80 h-11 rounded-2xl" />
              <p className="text-xs text-gray-400">Email: {user?.email} (cannot be changed)</p>
              <Button onClick={saveProfile} disabled={saving}
                className="w-full h-11 btn-primary-luxury border-0 text-white font-bold rounded-2xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Save Changes</>}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <button className="glass-floating rounded-2xl p-4 text-center" onClick={() => navigate(SCREENS.CREDITS)}>
            <div className="w-9 h-9 accent-peach rounded-xl flex items-center justify-center mx-auto mb-1.5"><Zap className="w-5 h-5 text-white" /></div>
            <p className="text-xl font-bold text-gray-900">{user?.credits || 0}</p>
            <p className="text-[10px] text-gray-400">Credits</p>
          </button>
          <button className="glass-floating rounded-2xl p-4 text-center" onClick={() => navigate(SCREENS.ORDERS)}>
            <div className="w-9 h-9 accent-pink rounded-xl flex items-center justify-center mx-auto mb-1.5"><ShoppingBag className="w-5 h-5 text-white" /></div>
            <p className="text-xl font-bold text-gray-900">{(orders || []).length}</p>
            <p className="text-[10px] text-gray-400">Orders</p>
          </button>
        </div>

        {/* Saved Address */}
        <button onClick={() => navigate(SCREENS.ADDRESS)} className="w-full glass-floating rounded-[22px] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-gray-800">Delivery Address</p>
            {userAddress?.flat ? (
              <p className="text-xs text-gray-400 truncate">
                {[userAddress.flat, userAddress.area, userAddress.city].filter(Boolean).join(', ')}
              </p>
            ) : (
              <p className="text-xs text-pink-400">Tap to set your address</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
        </button>

        {/* Menu Items */}
        <div className="glass-floating rounded-[22px] p-4 space-y-1">
          <button onClick={() => navigate(SCREENS.CREDITS)} className="w-full flex items-center gap-3 py-3 border-b border-white/50">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="flex-1 text-left text-sm text-gray-700">Buy Credits</span>
            <span className="text-xs text-gray-400 mr-1">{user?.credits || 0} left</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
          <button onClick={() => navigate(SCREENS.ORDERS)} className="w-full flex items-center gap-3 py-3 border-b border-white/50">
            <ShoppingBag className="w-5 h-5 text-pink-500" />
            <span className="flex-1 text-left text-sm text-gray-700">My Orders</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
          {user?.auth_provider !== 'google' && (
          <button onClick={() => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); setShowPwdModal(true) }}
            className="w-full flex items-center gap-3 py-3 border-b border-white/50">
            <Lock className="w-5 h-5 text-purple-500" />
            <span className="flex-1 text-left text-sm text-gray-700">Change Password</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
          )}
          <a href={`tel:${SUPPORT_PHONE}`} className="w-full flex items-center gap-3 py-3">
            <Phone className="w-5 h-5 text-green-500" />
            <span className="flex-1 text-left text-sm text-gray-700">Contact Support</span>
            <span className="text-xs text-gray-400 mr-1">{SUPPORT_PHONE}</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </a>
        </div>

        {/* Version + Logout */}
        <p className="text-center text-[10px] text-gray-300 pt-1">FatafatDecor Web v2.1</p>
        <Button onClick={handleLogout}
          variant="outline" className="w-full h-12 border-red-200 bg-white/50 text-red-400 font-semibold rounded-2xl hover:bg-red-50">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>
    </div>

    {/* Change Password Modal */}
    {showPwdModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-floating rounded-[28px] w-full max-w-sm overflow-hidden">
          <div className="iridescent aurora-shimmer p-5 text-center relative">
            <button onClick={() => setShowPwdModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white/25 rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
            <Lock className="w-8 h-8 text-white mx-auto mb-2" />
            <h2 className="text-white font-display text-xl">Change Password</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="relative">
              <Input placeholder="Current Password" type={showCurrentPwd ? 'text' : 'password'} value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                className="bg-white/70 border-white/80 h-11 rounded-2xl pr-10" />
              <button onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showCurrentPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <div className="relative">
              <Input placeholder="New Password (min 6 chars)" type={showNewPwd ? 'text' : 'password'} value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                className="bg-white/70 border-white/80 h-11 rounded-2xl pr-10" />
              <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showNewPwd ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <Input placeholder="Confirm New Password" type="password" value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              className="bg-white/70 border-white/80 h-11 rounded-2xl" />
            {newPwd && confirmPwd && newPwd !== confirmPwd && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            <Button onClick={handleChangePassword} disabled={changingPwd || !currentPwd || !newPwd || !confirmPwd}
              className="w-full h-11 btn-primary-luxury border-0 text-white font-bold rounded-2xl disabled:opacity-50">
              {changingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </Button>
          </div>
        </div>
      </div>
    )}
  </div>
)
}
