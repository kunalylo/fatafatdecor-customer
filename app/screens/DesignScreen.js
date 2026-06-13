'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Sparkles, Plus, Package, IndianRupee, Trash2, ShoppingBag, RefreshCw, Loader2, ChevronDown, Image as ImageIcon, X, Maximize2, Gift } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS, customerBreakdown } from '../lib/constants'
import { api } from '../lib/constants'

// Customer-facing item-name cleanup — older designs stored raw inventory names
// like "Orange ribbon_bow 0\"" (underscores + meaningless zero-inch size).
const prettyName = (s) => String(s || '').replace(/_/g, ' ').replace(/\s+0"\s*$/, '').replace(/\s{2,}/g, ' ').trim()

export default function DesignScreen() {
  const { selectedDesign, setSelectedDesign, loading, navigate, handleCreateOrder, giftCart, setGiftCart, giftMode, setGiftMode } = useApp()
  const [imageLoading, setImageLoading] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // If design was loaded from list (no image), fetch full design with image
  useEffect(() => {
    if (selectedDesign && !selectedDesign.decorated_image && selectedDesign.id) {
      setImageLoading(true)
      api(`designs/${selectedDesign.id}`).then(full => {
        if (!full.error) setSelectedDesign(full)
      }).finally(() => setImageLoading(false))
    }
  }, [selectedDesign?.id])

  const [localAddonItems, setLocalAddonItems] = useState(null)
  const [localSnapshotItems, setLocalSnapshotItems] = useState(null)

  if (!selectedDesign) return null
  const d = selectedDesign

  // ── Reference-flow detection ─────────────────────────────────────────
  const isReferenceFlow = d.flow === 'reference' || !!d.reference_design_id

  // Legacy fields (kit-based) — still used by older designs
  const kitItems   = (d.kit_items   || []).length > 0 ? d.kit_items   : (d.items_used || []).filter(i => i.is_kit_item)
  const addonItems = (d.addon_items || []).length > 0 ? d.addon_items : (d.items_used || []).filter(i => !i.is_kit_item)
  const hasKit     = !isReferenceFlow && (d.kit_name || kitItems.length > 0)

  // ── Reference-flow data ──────────────────────────────────────────────
  const snapshotItems   = localSnapshotItems !== null
    ? localSnapshotItems
    : (d.snapshot?.items || [])
  const breakdown       = d.customer_breakdown
    || (isReferenceFlow && d.snapshot?.base_price ? customerBreakdown(d.snapshot.base_price) : null)
  const referenceThumb  = d.reference_thumbnail_url || d.reference_image_url
  const referencePrice  = d.reference_price || d.snapshot?.base_price

  // Allow customer to remove rentable items from the snapshot
  const deleteSnapshotItem = (idx) => {
    const next = (snapshotItems).filter((_, i) => i !== idx)
    setLocalSnapshotItems(next)
  }

  // ── Pricing calculation ──────────────────────────────────────────────
  const displayAddonItems = localAddonItems !== null ? localAddonItems : addonItems
  const deleteAddonItem = (id) => setLocalAddonItems((localAddonItems || addonItems).filter(i => i.id !== id))
  const addonTotal = displayAddonItems.reduce((s, i) => s + (Number(i.price) || Number(i.selling_price_unit) || 0) * (Number(i.quantity) || 1), 0)

  const giftAddonTotal = (giftCart.length > 0 && giftMode === 'addon')
    ? giftCart.reduce((s, g) => s + (Number(g.price) || 0) * (Number(g.quantity) || 1), 0)
    : 0

  // For reference flow, recompute totals if user removed items
  let referenceTotal = 0
  if (isReferenceFlow && breakdown) {
    if (localSnapshotItems !== null) {
      // User removed items → recompute decoration based on remaining items at 2x
      const newItemsTotal = snapshotItems.reduce((s, i) =>
        s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 1), 0)
      const newBreakdown = customerBreakdown(newItemsTotal)
      referenceTotal = newBreakdown.total
    } else {
      referenceTotal = breakdown.total
    }
  }

  const decorationTotal = isReferenceFlow
    ? referenceTotal
    : ((d.kit_cost || 0) + addonTotal)
  const displayTotal = decorationTotal + giftAddonTotal
  const halfNow = Math.round(displayTotal / 2)

  // Group reference items by category for cleaner display
  const groupedItems = isReferenceFlow ? snapshotItems.reduce((acc, item) => {
    const cat = item.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {}) : {}

  // Swipeable gallery: AI result, your room, reference
  const decoratedSrc = d.decorated_image && (d.decorated_image.includes('ik.imagekit.io') ? `${d.decorated_image}?tr=w-800,c-maintain_ratio` : d.decorated_image)
  const galleryViews = [
    d.decorated_image     && { id: 'ai',   image: decoratedSrc,          label: 'AI Decorated', badge: 'AI Generated' },
    d.original_image_url  && { id: 'room', image: d.original_image_url,  label: 'Your Room',    badge: 'Your Photo' },
    d.reference_image_url && { id: 'ref',  image: d.reference_image_url, label: 'Inspired By',  badge: 'Reference' },
  ].filter(Boolean)

  return (
    <div className="slide-up pb-28 bg-aurora-soft min-h-screen">

      {/* ── Full-screen comparison: AI result + your room + reference ── */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto" onClick={() => setFullscreen(false)}>
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
            <span className="text-white font-bold text-sm">Design Comparison</span>
            <button onClick={() => setFullscreen(false)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="p-4 space-y-6 pb-16" onClick={e => e.stopPropagation()}>
            {d.decorated_image && (
              <div>
                <p className="text-pink-300 text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> AI Decorated Result</p>
                <img src={d.decorated_image} alt="AI result" className="w-full rounded-2xl border border-white/10" />
              </div>
            )}
            {d.original_image_url && (
              <div>
                <p className="text-sky-300 text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Your Room (uploaded)</p>
                <img src={d.original_image_url} alt="Your room" className="w-full rounded-2xl border border-white/10" />
              </div>
            )}
            {d.reference_image_url && (
              <div>
                <p className="text-amber-300 text-[11px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Inspired By (reference)</p>
                <img src={d.reference_image_url} alt="Reference" className="w-full rounded-2xl border border-white/10" />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-4 pt-6">
        <button onClick={() => navigate(SCREENS.HOME)} className="w-9 h-9 rounded-full glass-card flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-display text-2xl text-gray-900">Design <span className="italic iridescent-text">preview</span></h1>
        <Badge className="ml-auto btn-primary-luxury border-0 text-white">{d.occasion?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
      </div>
      <div className="px-4 space-y-4">

        {/* Hero — swipeable design gallery */}
        {imageLoading ? (
          <div className="rounded-2xl border border-white/80 glass-card h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          </div>
        ) : (
          <DesignGallery views={galleryViews} onExpand={() => setFullscreen(true)} />
        )}

        {/* "Inspired by" reference thumbnail — only for reference-flow designs */}
        {isReferenceFlow && referenceThumb && (
          <div className="glass-floating rounded-[22px] p-3 flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/80 shrink-0">
              <img src={referenceThumb} alt="Reference" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-pink-500">Inspired by</p>
              <p className="text-sm font-bold text-gray-800 truncate">{d.theme || 'Premium Decoration Style'}</p>
              {referencePrice && (
                <p className="text-xs text-gray-500">Decoration value Rs {referencePrice.toLocaleString('en-IN')}</p>
              )}
            </div>
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
        )}

        {/* ── REFERENCE FLOW: Itemized list grouped by category ──────── */}
        {isReferenceFlow && snapshotItems.length > 0 && (
          <div className="glass-floating rounded-[22px] p-4">
            <button
              onClick={() => setShowAllItems(v => !v)}
              className="w-full flex items-center justify-between mb-2"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-pink-500" />
                <h3 className="font-bold text-sm text-gray-800">What&apos;s Included ({snapshotItems.length} items)</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAllItems ? 'rotate-180' : ''}`} />
            </button>

            {showAllItems && (
              <div className="space-y-3 mt-2">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <p className="eyebrow text-pink-500 mb-1">{category}</p>
                    <div className="space-y-1">
                      {items.map((item, i) => (
                        <div key={item.id || i} className="flex items-center gap-2 py-1">
                          <span className="text-xs text-gray-600 flex-1">
                            <strong className="text-gray-800">{item.quantity}×</strong> {prettyName(item.name)}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">Rs {((Number(item.unit_price) || 0) * (Number(item.quantity) || 1)).toFixed(0)}</span>
                          {item.is_removable && (
                            <button onClick={() => deleteSnapshotItem(snapshotItems.indexOf(item))} className="w-6 h-6 rounded bg-red-50 flex items-center justify-center">
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LEGACY FLOW: Kit display ──────────────────────────────── */}
        {hasKit && (
          <div className="glass-floating rounded-[22px] p-4 border border-pink-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <h3 className="font-bold text-sm text-pink-600">Final Look Kit</h3>
            </div>
            {d.kit_name && <p className="text-sm font-bold text-gray-700 mb-1">{d.kit_name}</p>}
            <div className="space-y-1">
              {kitItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                  <span className="text-xs text-gray-600 flex-1">{prettyName(item.name)} {item.color ? `(${item.color})` : ''}</span>
                  <span className="text-xs font-semibold text-pink-500">₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-pink-100/70">
              <span className="text-xs font-bold text-gray-600">Kit Cost</span>
              <span className="text-sm font-bold text-pink-500">₹{d.kit_cost || kitItems.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)}</span>
            </div>
          </div>
        )}

        {/* ── LEGACY FLOW: Add-on items ─────────────────────────────── */}
        {!isReferenceFlow && displayAddonItems.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-700 mb-2">
              <Plus className="w-4 h-4 inline text-purple-500 mr-1" />
              Add-on Items
              {displayAddonItems.some(i => i.is_rentable) && <span className="ml-2 text-[10px] text-purple-400 font-normal">(tap trash to remove items)</span>}
            </h3>
            <div className="space-y-2">
              {displayAddonItems.map((item, i) => (
                <div key={item.id || i} className="glass-card rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{prettyName(item.name)}</p>
                    <p className="text-[10px] text-gray-400">
                      {item.color ? `${item.color} • ` : ''}{item.category ? item.category.replace('_', ' ') : ''}
                    </p>
                  </div>
                  <p className="text-sm font-bold shrink-0 text-purple-500">
                    ₹{((item.price || item.selling_price_unit || 0) * (item.quantity || 1)).toFixed(0)}
                  </p>
                  {item.is_rentable && (
                    <button onClick={() => deleteAddonItem(item.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 hover:bg-red-100 active:bg-red-200">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex justify-between px-1">
                <span className="text-xs text-gray-400">Add-ons Total</span>
                <span className="text-xs font-bold text-purple-500">₹{addonTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Add Gifts to decoration */}
        <div onClick={() => { if (giftMode !== 'addon') setGiftCart([]); setGiftMode('addon'); navigate(SCREENS.GIFTS) }}
          className="mb-3 p-4 border-2 border-dashed border-pink-200 rounded-2xl flex items-center gap-3 cursor-pointer active:scale-95 transition-transform bg-white/50">
          <div className="w-10 h-10 accent-pink rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-pink-600 text-sm">Add Gifts to Decoration</p>
            <p className="text-xs text-gray-400">Surprise them with flowers, bouquets &amp; more</p>
          </div>
          {giftCart.length > 0 && giftMode === 'addon' && (
            <span className="bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">{giftCart.length}</span>
          )}
        </div>

        {/* Show selected gifts */}
        {giftCart.length > 0 && giftMode === 'addon' && (
          <div className="mb-3 p-4 glass-floating rounded-[22px]">
            <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5"><Gift className="w-4 h-4 text-pink-500" /> Added Gifts</p>
            {giftCart.map((g, i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <span className="text-sm text-gray-700">{g.quantity}× {g.name}</span>
                <span className="text-sm font-semibold text-pink-600">₹{(g.price * g.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="border-t border-pink-100/70 mt-2 pt-2 flex justify-between">
              <span className="text-sm font-bold text-gray-700">Gifts Total</span>
              <span className="text-sm font-bold text-pink-600">₹{giftCart.reduce((s,g)=>s+g.price*g.quantity,0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}

        {/* ── REFERENCE FLOW: Customer breakdown waterfall ──────────── */}
        {isReferenceFlow && breakdown && (
          <div className="glass-floating rounded-[22px] p-4">
            <h3 className="font-bold text-sm text-gray-800 mb-3">Price Breakdown</h3>
            <div className="space-y-1.5 text-sm">
              <PriceRow label="Decoration & Material" value={breakdown.decoration_total} />
              <PriceRow label="Setup & Transportation" value={breakdown.setup_transport} sub />
              <PriceRow label="Platform Fee" value={breakdown.platform_fee} sub />
              <PriceRow label="Convenience Fee" value={breakdown.convenience_fee} sub />
              {giftAddonTotal > 0 && (
                <PriceRow label="Gifts" value={giftAddonTotal} accent="pink" />
              )}
              <div className="border-t border-gray-200/70 my-2" />
              <PriceRow label="Subtotal" value={breakdown.subtotal + giftAddonTotal} muted />
              <PriceRow label="GST (18%)" value={breakdown.gst} muted />
              <div className="border-t border-gray-200/70 my-2" />
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">Customer Total</p>
                  <p className="text-[10px] text-gray-400">All-inclusive</p>
                </div>
                <div className="flex items-center text-pink-600">
                  <IndianRupee className="w-5 h-5" />
                  <span className="text-2xl font-bold">{displayTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="mt-3 p-2.5 bg-pink-50/70 border border-pink-100 rounded-xl flex items-center justify-between">
                <span className="text-xs text-gray-600">Pay <strong className="text-pink-600">Rs {halfNow.toLocaleString('en-IN')}</strong> now (50%)</span>
                <span className="text-xs text-gray-500">Rest on delivery</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LEGACY FLOW: simple total card ────────────────────────── */}
        {!isReferenceFlow && (
          <div className="glass-floating rounded-[22px] p-4 border border-green-200/60">
            {giftAddonTotal > 0 ? (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Decoration</span>
                  <span className="font-semibold text-gray-700">₹{decorationTotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Gifts</span>
                  <span className="font-semibold text-pink-600">₹{giftAddonTotal.toFixed(0)}</span>
                </div>
                <div className="border-t border-green-200/60 pt-2 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Total (50% now)</h3>
                  <div className="flex items-center text-green-600">
                    <IndianRupee className="w-5 h-5" />
                    <span className="text-2xl font-bold">{displayTotal.toFixed(0)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-700">Total Cost</h3>
                  <p className="text-xs text-gray-400">{hasKit ? 'Kit + Add-ons' : 'All items'} · pay 50% now</p>
                </div>
                <div className="flex items-center text-green-600">
                  <IndianRupee className="w-5 h-5" />
                  <span className="text-2xl font-bold">{displayTotal.toFixed(0)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {d.status === 'generated' && (
            <>
              <Button onClick={() => {
                // Build current items list:
                // Reference flow: pass localSnapshotItems if user removed items, else null
                // Legacy flow: kit items (always kept) + user's current addon items
                const itemsOverride = isReferenceFlow
                  ? (localSnapshotItems !== null ? localSnapshotItems : null)
                  : (localAddonItems !== null ? [...kitItems, ...localAddonItems] : null)
                const totalOverride = (isReferenceFlow && localSnapshotItems !== null)
                  ? referenceTotal
                  : (localAddonItems !== null ? decorationTotal : null)
                handleCreateOrder(totalOverride, giftCart.length > 0 && giftMode === 'addon' ? giftCart : [], itemsOverride)
              }} disabled={loading}
                className="w-full h-14 btn-primary-luxury border-0 text-white font-bold text-base rounded-2xl">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingBag className="w-5 h-5 mr-2" /> Order & Book Delivery</>}
              </Button>
              <Button onClick={() => navigate(SCREENS.UPLOAD)} variant="outline"
                className="w-full h-12 border-pink-200 bg-white/50 text-pink-500 font-semibold rounded-2xl hover:bg-pink-50">
                <RefreshCw className="w-4 h-4 mr-2" /> Try Another Style
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PriceRow({ label, value, sub, muted, accent }) {
  const labelClass = sub
    ? 'text-gray-500 text-xs pl-3'
    : muted
      ? 'text-gray-500'
      : 'text-gray-600'
  const valueClass = accent === 'pink'
    ? 'text-pink-600 font-semibold'
    : (sub || muted)
      ? 'text-gray-700 font-semibold'
      : 'text-gray-900 font-semibold'
  return (
    <div className="flex justify-between items-center">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>Rs {Number(value || 0).toLocaleString('en-IN')}</span>
    </div>
  )
}

// Swipeable AI design gallery — replaces the old tap-to-open hero.
function DesignGallery({ views, onExpand }) {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const w = el.clientWidth
      if (!w) return
      setIdx(Math.min(Math.round(el.scrollLeft / w), views.length - 1))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [views.length])

  if (!views.length) return null

  return (
    <div className="relative">
      <div ref={ref} className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-3">
        {views.map((v, i) => (
          <button key={v.id} onClick={() => onExpand(i)}
            className="snap-center flex-shrink-0 w-full aspect-[4/5] rounded-[24px] overflow-hidden relative glass-floating">
            <img src={v.image} alt={v.label} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-white" strokeWidth={2.4} />
              <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase">{v.badge}</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="text-left">
                <p className="text-white/80 text-[10px] font-bold tracking-[0.25em] uppercase">View {i + 1} of {views.length}</p>
                <h4 className="text-white font-display text-xl font-medium leading-tight mt-1">{v.label}</h4>
              </div>
              <div className="w-10 h-10 rounded-full glass-overlay flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-gray-800" strokeWidth={2.2} />
              </div>
            </div>
          </button>
        ))}
      </div>
      {views.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {views.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-8 bg-gray-900' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
