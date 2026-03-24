'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Sparkles, Plus, Package, IndianRupee, Trash2, ShoppingBag, RefreshCw, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SCREENS } from '../lib/constants'

export default function DesignScreen() {
  const { selectedDesign, loading, navigate, handleCreateOrder } = useApp()
  if (!selectedDesign) return null
  const d = selectedDesign
  const kitItems = (d.kit_items || []).length > 0 ? d.kit_items : (d.items_used || []).filter(i => i.is_kit_item)
  const addonItems = (d.addon_items || []).length > 0 ? d.addon_items : (d.items_used || []).filter(i => !i.is_kit_item)
  const hasKit = d.kit_name || kitItems.length > 0
  const [localAddonItems, setLocalAddonItems] = useState(null)
  const displayAddonItems = localAddonItems !== null ? localAddonItems : addonItems
  const deleteAddonItem = (id) => setLocalAddonItems((localAddonItems || addonItems).filter(i => i.id !== id))
  const addonTotal = displayAddonItems.reduce((s, i) => s + (Number(i.price) || Number(i.selling_price_unit) || 0) * (Number(i.quantity) || 1), 0)
  const displayTotal = (d.kit_cost || 0) + addonTotal
  return (
    <div className="slide-up pb-24 bg-white min-h-screen">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(SCREENS.HOME)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-bold text-lg text-gray-800">Design Preview</h1>
        <Badge className="ml-auto capitalize gradient-pink border-0 text-white">{d.occasion}</Badge>
      </div>
      <div className="px-4 space-y-4">
        {d.decorated_image && (
          <div className="rounded-2xl overflow-hidden border border-pink-100 shadow-lg shadow-pink-100/30">
            <img src={d.decorated_image} alt="Decorated" className="w-full" />
          </div>
        )}

        {/* Kit / Final Look */}
        {hasKit && (
          <Card className="border-2 border-pink-200 bg-pink-50/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <h3 className="font-bold text-sm text-pink-600">Final Look Kit</h3>
              </div>
              {d.kit_name && <p className="text-sm font-bold text-gray-700 mb-1">{d.kit_name}</p>}
              <div className="space-y-1">
                {kitItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span className="text-xs text-gray-600 flex-1">{item.name} {item.color ? `(${item.color})` : ''}</span>
                    <span className="text-xs font-semibold text-pink-500">Rs {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-pink-100">
                <span className="text-xs font-bold text-gray-600">Kit Cost</span>
                <span className="text-sm font-bold text-pink-500">Rs {d.kit_cost || kitItems.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add-on Items */}
        {displayAddonItems.length > 0 && (
          <div>
            <h3 className="font-bold text-sm text-gray-700 mb-2">
              <Plus className="w-4 h-4 inline text-purple-500 mr-1" />
              Add-on Items
              {displayAddonItems.some(i => i.is_rentable) && <span className="ml-2 text-[10px] text-purple-400 font-normal">(tap trash to remove items)</span>}
            </h3>
            <div className="space-y-2">
              {displayAddonItems.map((item, i) => (
                <Card key={item.id || i} className="border border-gray-100">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-50">
                      <Package className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {item.color ? `${item.color} • ` : ''}{item.category ? item.category.replace('_', ' ') : ''}
                      </p>
                    </div>
                    <p className="text-sm font-bold shrink-0 text-purple-500">
                      Rs {((item.price || item.selling_price_unit || 0) * (item.quantity || 1)).toFixed(0)}
                    </p>
                    {item.is_rentable && (
                      <button onClick={() => deleteAddonItem(item.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 hover:bg-red-100 active:bg-red-200">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-between px-1">
                <span className="text-xs text-gray-400">Add-ons Total</span>
                <span className="text-xs font-bold text-purple-500">Rs {addonTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Total Cost */}
        <Card className="border border-green-200 bg-green-50/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-700">Total Cost</h3>
                <p className="text-xs text-gray-400">{hasKit ? 'Kit + Add-ons' : 'All items'} included</p>
              </div>
              <div className="flex items-center text-green-600">
                <IndianRupee className="w-5 h-5" />
                <span className="text-2xl font-bold">{displayTotal.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {d.status === 'generated' && (
            <>
              <Button onClick={() => handleCreateOrder(displayTotal)} disabled={loading}
                className="w-full h-14 gradient-pink border-0 text-white font-bold text-base rounded-2xl shadow-pink">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingBag className="w-5 h-5 mr-2" /> Order & Book Delivery</>}
              </Button>
              <Button onClick={() => navigate(SCREENS.UPLOAD)} variant="outline"
                className="w-full h-12 border-pink-200 text-pink-500 font-semibold rounded-2xl hover:bg-pink-50">
                <RefreshCw className="w-4 h-4 mr-2" /> Regenerate Design
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
