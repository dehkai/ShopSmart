'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Key, Settings, RefreshCcw, Search, Sparkles, SlidersHorizontal, Layers, TrendingDown, ClipboardList, Laptop, X, Store, MapPin } from 'lucide-react'
import type { BasketResult, BasketItemResult } from '@/lib/types'
import type { Coordinates } from '@/hooks/useGeolocation'
import { MobileInputView } from './MobileInputView'
import { MobileOverviewView } from './MobileOverviewView'
import { MobileItemsView } from './MobileItemsView'

interface MobileAppShellProps {
  basketText: string
  setBasketText: (val: string) => void
  selectedState: string
  setSelectedState: (val: string) => void
  locationMode: 'gps' | 'region'
  setLocationMode: (mode: 'gps' | 'region') => void
  setCoords: (coords: Coordinates | null) => void
  radiusKm: number
  setRadiusKm: (km: number) => void
  result: BasketResult | null
  submittedCount: number
  loading: boolean
  error: string | null
  handleSubmit: () => void
  reset: () => void
  apiKey: string | null
  provider: string
  model: string
  setIsModalOpen: (val: boolean) => void
  resolvedTheme: string | undefined
  setTheme: (theme: string) => void
  mounted: boolean
  isSimulatorMode?: boolean
  setIsSimulatorMode?: (val: boolean) => void
}

type TabType = 'input' | 'overview' | 'items'

export function MobileAppShell({
  basketText,
  setBasketText,
  selectedState,
  setSelectedState,
  locationMode,
  setLocationMode,
  setCoords,
  radiusKm,
  setRadiusKm,
  result,
  submittedCount,
  loading,
  error,
  handleSubmit,
  reset,
  apiKey,
  provider,
  model,
  setIsModalOpen,
  resolvedTheme,
  setTheme,
  mounted,
  isSimulatorMode = false,
  setIsSimulatorMode,
}: MobileAppShellProps) {
  const [activeTab, setActiveTab] = useState<TabType>('input')
  const [selectedItem, setSelectedItem] = useState<BasketItemResult | null>(null)
  const [itemPrices, setItemPrices] = useState<any[]>([])
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false)

  // Auto-switch tab to overview when result is loaded
  useEffect(() => {
    if (result) {
      setActiveTab('overview')
    } else {
      setActiveTab('input')
    }
    setSelectedItem(null)
  }, [result])

  const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

  // Reset selectedItem when switching tabs
  useEffect(() => {
    setSelectedItem(null)
  }, [activeTab])

  // Fetch prices dynamically for selectedItem in selectedState
  useEffect(() => {
    if (!selectedItem) {
      setItemPrices([])
      return
    }
    setLoadingPrices(true)
    const fetchPrices = async () => {
      try {
        const url = `/api/items?item_code=${selectedItem.item_code}&state=${encodeURIComponent(selectedState)}`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setItemPrices(data)
        }
      } catch (err) {
        console.error('Failed to fetch item prices', err)
      } finally {
        setLoadingPrices(false)
      }
    }
    fetchPrices()
  }, [selectedItem, selectedState])

  // Find match details for a given item
  const getMatchInfo = (name: string) => {
    if (!result) return null
    return result.matches.find((m) => m.item_name === name || m.query === name) || null
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'input':
        return (
          <MobileInputView
            basketText={basketText}
            setBasketText={setBasketText}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            locationMode={locationMode}
            setLocationMode={setLocationMode}
            setCoords={setCoords}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            loading={loading}
            error={error}
            handleSubmit={handleSubmit}
          />
        )
      case 'overview':
        return result ? (
          <MobileOverviewView result={result} selectedState={selectedState} />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted">No results yet.</div>
        )
      case 'items':
        return result ? (
          <MobileItemsView items={result.items} matches={result.matches} onItemClick={(item) => setSelectedItem(item)} />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted">No results yet.</div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen flex flex-col bg-surface text-fg z-50 select-none overflow-hidden">
      {/* 1. Header (iOS style sticky header) */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-surface-dim/35 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xl font-extrabold text-primary tracking-tighter">ShopSmart</span>
          <span className="bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase">
            PWA
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Exit simulator button */}
          {isSimulatorMode && setIsSimulatorMode && (
            <button
              onClick={() => setIsSimulatorMode(false)}
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-overlay-sm border border-border text-muted cursor-pointer pwa-header-btn"
              title="Exit Mobile Simulator"
              aria-label="Exit Simulator"
            >
              <Laptop size={13} />
            </button>
          )}

          {/* Reset button if result loaded */}
          {result && (
            <button
              onClick={reset}
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-overlay-sm border border-border text-muted cursor-pointer pwa-header-btn"
              aria-label="Start over"
            >
              <RefreshCcw size={13} />
            </button>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-overlay-sm border border-border text-muted cursor-pointer pwa-header-btn"
            aria-label="Toggle theme"
          >
            {mounted ? (
              resolvedTheme === 'dark' ? <Sun size={13} /> : <Moon size={13} />
            ) : (
              <span className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Connection Settings */}
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className={`flex items-center gap-1 px-3 py-1.5 border rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-pointer pwa-header-btn ${
              apiKey
                ? 'bg-primary/10 border-primary/25 text-primary'
                : 'bg-red-500/10 border-red-500/25 text-red-400'
            }`}
          >
            <span className={`w-1 h-1 rounded-full ${apiKey ? 'bg-primary animate-pulse' : 'bg-red-400'}`} />
            <span>{apiKey ? 'API Active' : 'Setup API'}</span>
          </button>
        </div>
      </header>

      {/* 2. Scrollable Viewport Panel */}
      <main className="flex-1 min-h-0 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full h-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Bottom Tab Bar Navigation (If optimized, or static icons) */}
      {result && (
        <nav className="flex-shrink-0 bg-surface-dim/80 backdrop-blur-lg border-t border-border/70 pb-safe relative z-20">
          <div className="flex h-16 px-4 items-center justify-around">
            {/* Tab: Input */}
            <button
              onClick={() => setActiveTab('input')}
              type="button"
              className={`flex flex-col items-center justify-center w-20 h-full relative cursor-pointer active:scale-95 transition-transform ${
                activeTab === 'input' ? 'text-primary' : 'text-muted/60'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">List</span>
              {activeTab === 'input' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            {/* Tab: Overview */}
            <button
              onClick={() => setActiveTab('overview')}
              type="button"
              className={`flex flex-col items-center justify-center w-20 h-full relative cursor-pointer active:scale-95 transition-transform ${
                activeTab === 'overview' ? 'text-primary' : 'text-muted/60'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Savings</span>
              {activeTab === 'overview' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            {/* Tab: Items */}
            <button
              onClick={() => setActiveTab('items')}
              type="button"
              className={`flex flex-col items-center justify-center w-20 h-full relative cursor-pointer active:scale-95 transition-transform ${
                activeTab === 'items' ? 'text-primary' : 'text-muted/60'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Compare</span>
              {activeTab === 'items' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </nav>
      )}

      {/* Bottom Sheet Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-xs"
            />

            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: EASE_DRAWER }}
              className="fixed bottom-0 inset-x-0 bg-surface border-t border-border rounded-t-[28px] z-[70] flex flex-col max-h-[85vh] shadow-2xl"
            >
              {/* Sheet Drag Handle Indicator */}
              <div className="w-full flex justify-center py-3 shrink-0 cursor-pointer" onClick={() => setSelectedItem(null)}>
                <div className="w-10 h-1.5 bg-muted/20 rounded-full" />
              </div>

              {/* Sheet Header */}
              <div className="px-6 pb-4 border-b border-border/40 flex items-start justify-between gap-4 shrink-0">
                <div>
                  <h3 className="text-lg font-black text-fg leading-tight">
                    {selectedItem.item_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold text-muted/50 uppercase tracking-wide">
                      ID: #{selectedItem.item_code}
                    </span>
                    <span>·</span>
                    <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3" />
                      Confidence: {Math.round((getMatchInfo(selectedItem.item_name)?.confidence ?? 1.0) * 100)}%
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-full bg-overlay-sm border border-border text-muted cursor-pointer pwa-header-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sheet Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Match Source Info Box */}
                {(() => {
                  const match = getMatchInfo(selectedItem.item_name)
                  return (
                    <div className="bg-glass-card-bg/25 border border-glass-border p-4 rounded-2xl space-y-2">
                      <div className="text-[10px] font-bold text-muted uppercase tracking-wider">AI Resolution Details</div>
                      <div className="text-xs text-fg leading-relaxed">
                        User query <span className="font-semibold text-primary">&quot;{match?.query}&quot;</span> was matched via{' '}
                        <span className="font-extrabold uppercase text-xs">{match?.match_type} matcher</span> to database item{' '}
                        <span className="font-semibold">{selectedItem.item_name}</span>.
                      </div>
                    </div>
                  )
                })()}

                {/* Price Listings */}
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Premise Pricing</div>
                  <div className="space-y-3">
                    {loadingPrices ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[11px] text-muted">Loading live prices...</span>
                      </div>
                    ) : itemPrices.length > 0 ? (
                      itemPrices.map((store, idx) => {
                        const isCheapest = idx === 0
                        const basePrice = itemPrices[0].price

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-[border-color,background-color] ${
                              isCheapest
                                ? 'bg-primary/5 border-primary/20 shadow-sm shadow-primary/5'
                                : 'bg-glass-card-bg/10 border-border/40'
                            }`}
                          >
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${store.premise}, ${store.address || ''}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-w-0 flex-1 flex items-start gap-3 group/item cursor-pointer"
                              title={`Directions to ${store.premise}`}
                            >
                              <div
                                className={`p-2 rounded-xl mt-0.5 shrink-0 transition-colors ${
                                  isCheapest 
                                    ? 'bg-primary/10 text-primary group-hover/item:bg-primary/20' 
                                    : 'bg-muted/10 text-muted group-hover/item:bg-muted/20'
                                }`}
                              >
                                <Store className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-extrabold text-fg leading-tight truncate group-hover/item:text-primary transition-colors">{store.premise}</h4>
                                <p className="text-[9px] text-muted/50 truncate mt-1 flex items-center gap-0.5 group-hover/item:text-muted/70 transition-colors">
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                  {store.address || 'Location data not available'}
                                </p>
                              </div>
                            </a>

                            <div className="text-right shrink-0">
                              <div className={`text-sm font-black ${isCheapest ? 'text-primary' : 'text-fg'}`}>
                                RM {store.price.toFixed(2)}
                              </div>
                              {isCheapest ? (
                                <div className="bg-primary/15 text-primary text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full mt-1 inline-block select-none pointer-events-none">
                                  cheapest
                                </div>
                              ) : (
                                <div className="text-[9px] font-bold text-red-400 mt-1 font-mono">
                                  +{basePrice > 0 ? Math.round(((store.price - basePrice) / basePrice) * 100) : 0}%
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-xs text-muted/60 italic py-4 text-center">
                        No premise pricing available for this state.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
