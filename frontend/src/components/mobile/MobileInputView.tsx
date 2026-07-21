'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { LocationControl } from '@/components/basket/LocationControl'
import { Spinner } from '@/components/ui/Spinner'
import { EASE_OUT } from '@/lib/motion'
import type { Coordinates } from '@/hooks/useGeolocation'

interface MobileInputViewProps {
  basketText: string
  setBasketText: (val: string) => void
  selectedState: string
  setSelectedState: (val: string) => void
  locationMode: 'gps' | 'region'
  setLocationMode: (mode: 'gps' | 'region') => void
  setCoords: (coords: Coordinates | null) => void
  radiusKm: number
  setRadiusKm: (km: number) => void
  loading: boolean
  error: string | null
  handleSubmit: () => void
}

const SAMPLES = [
  {
    label: 'Basic Groceries',
    items: ['2kg Onion Red', '1 pack Gardenia White Bread', '5kg Jasmine Rice', '1kg Chicken Breast'],
    state: 'W.P. Kuala Lumpur',
  },
  {
    label: 'Curry Ingredients',
    items: ['1 whole Chicken', '2 packs Santan (Coconut Milk)', '1 pack Curry Powder', '1kg Potato', '500g Garlic'],
    state: 'Johor',
  },
]

export function MobileInputView({
  basketText,
  setBasketText,
  selectedState,
  setSelectedState,
  locationMode,
  setLocationMode,
  setCoords,
  radiusKm,
  setRadiusKm,
  loading,
  error,
  handleSubmit,
}: MobileInputViewProps) {
  const lineCount = basketText
    .split('\n')
    .filter((l) => l.trim().length > 0).length

  const handleSelectSample = (sample: typeof SAMPLES[0]) => {
    setBasketText(sample.items.join('\n'))
    setSelectedState(sample.state)
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] h-full">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-fg tracking-tight">Smart Optimizer</h2>
        <p className="text-[11px] text-muted leading-relaxed">
          Paste your shopping list. We&apos;ll find which local retailer is the cheapest.
        </p>
      </div>

      {/* Location / State picker */}
      <div className="bg-glass-card-bg/25 border border-glass-border p-4 rounded-2xl">
        <LocationControl
          mode={locationMode}
          onModeChange={setLocationMode}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          onLocationChange={setCoords}
        />
      </div>

      {/* Shopping List Input */}
      <div className="flex flex-col gap-2 flex-1 min-h-[180px]">
        <div className="flex items-center justify-between">
          <label
            htmlFor="mobile-basket-input"
            className="text-[10px] font-bold uppercase tracking-wider text-muted/60"
            style={{ letterSpacing: '0.08em' }}
          >
            Shopping List
          </label>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
            {lineCount > 0 ? `${lineCount} item${lineCount !== 1 ? 's' : ''}` : 'One item per line'}
          </span>
        </div>

        <textarea
          id="mobile-basket-input"
          value={basketText}
          onChange={(e) => setBasketText(e.target.value)}
          placeholder="e.g.&#10;1kg Red Onions&#10;1 loaf Gardenia Bread&#10;5kg Jasmine Rice"
          disabled={loading}
          className="w-full flex-1 min-h-[140px] bg-surface-dim/40 border border-border rounded-2xl p-4 font-mono text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-subtle/35 resize-none text-xs leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Quick Samples */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted/60" style={{ letterSpacing: '0.08em' }}>
          Try a Sample List
        </div>
        <div className="flex gap-2">
          {SAMPLES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => handleSelectSample(sample)}
              disabled={loading}
              className="flex-1 text-left p-3 rounded-xl bg-glass-card-bg/30 border border-glass-border text-[11px] pwa-btn-sample cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-fg group-hover:text-primary transition-colors">{sample.label}</div>
                <div className="text-muted/60 text-[9px] mt-0.5">{sample.items.length} items · {sample.state}</div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-error flex items-start gap-2"
          >
            <span className="mt-0.5">⚠️</span>
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || lineCount === 0}
        type="button"
        className="w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-xs py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/15 disabled:opacity-50 disabled:pointer-events-none shrink-0 pwa-primary-btn"
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, filter: 'blur(2px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(2px)' }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex items-center gap-2"
            >
              <Spinner size="sm" className="text-on-primary" />
              Optimizing Basket...
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, filter: 'blur(2px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(2px)' }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex items-center gap-2"
            >
              Optimize Grocery Prices
              <ArrowRight size={14} strokeWidth={2.5} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}
