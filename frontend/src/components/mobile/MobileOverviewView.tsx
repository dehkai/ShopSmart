'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { BasketResult } from '@/lib/types'
import { Landmark, TrendingDown, CheckCircle, Percent, Navigation } from 'lucide-react'
import { formatDistance, storeMapsUrl } from '@/lib/format'
import { EASE_OUT } from '@/lib/motion'

interface MobileOverviewViewProps {
  result: BasketResult
  selectedState: string
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export function MobileOverviewView({ result, selectedState }: MobileOverviewViewProps) {
  const reduceMotion = useReducedMotion()
  const matchedItemsCount = result.matches.filter((m) => m.resolved).length
  const totalItemsCount = result.matches.length

  const isGpsMode = result.radius_km_used != null
  const recommendedStore = result.store_ranking?.[0] || null
  const otherStores = result.store_ranking?.slice(1, 6) || []

  // Savings percentage
  const averageTotal = result.total + result.savings
  const savingsPct = averageTotal > 0 ? Math.round((result.savings / averageTotal) * 100) : 0

  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-5 px-4 py-4 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] h-full"
    >
      {/* 1. Header Hero Card (Savings focus) */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-primary via-primary-dim to-primary p-6 text-on-primary shadow-lg shadow-primary/20 shrink-0"
      >
        {/* Glow effect */}
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-white/10 rounded-full blur-2xl" />

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-primary/70">Optimized Basket Cost</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black tracking-tight">RM {result.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
          <div className="space-y-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-on-primary/60">Estimated Savings</span>
            <div className="flex items-center gap-1 font-bold text-base">
              <TrendingDown className="w-4 h-4 text-emerald-300" />
              <span>RM {result.savings.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-on-primary/60">Savings Rate</span>
            <div className="flex items-center gap-1 font-bold text-base">
              <Percent className="w-3.5 h-3.5 text-emerald-300" />
              <span>{savingsPct}% saved</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Quick Info Chips */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 shrink-0">
        <div className="bg-glass-card-bg/25 border border-glass-border p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider">Coverage</div>
            <div className="text-xs font-black text-fg">{matchedItemsCount} / {totalItemsCount} items</div>
          </div>
        </div>
        <div className="bg-glass-card-bg/25 border border-glass-border p-3.5 rounded-2xl flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${isGpsMode ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-400'}`}>
            {isGpsMode ? <Navigation className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-[9px] font-bold text-muted uppercase tracking-wider">
              {isGpsMode ? 'Near you' : 'State'}
            </div>
            <div className="text-xs font-black text-fg truncate max-w-[80px]" title={isGpsMode ? `Within ${result.radius_km_used} km` : selectedState || 'National Average'}>
              {isGpsMode && result.radius_km_used != null ? `${formatDistance(result.radius_km_used)}` : selectedState || 'National'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Recommended Store Card */}
      {recommendedStore && (
        <motion.div variants={itemVariants} className="space-y-2.5 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted/60" style={{ letterSpacing: '0.08em' }}>
            Recommended Retailer
          </div>
          <div className="bg-glass-card-bg/30 border-2 border-primary/20 p-5 rounded-2xl relative overflow-hidden space-y-4">
            {/* Tag indicator */}
            <div className="absolute top-0 right-0 bg-primary/15 text-primary border-l border-b border-primary/20 px-3.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-bl-xl">
              1st Choice
            </div>

            <a
              href={storeMapsUrl(recommendedStore)}
              target="_blank"
              rel="noopener noreferrer"
              className="block space-y-1 pr-16 group cursor-pointer"
              title={`Directions to ${recommendedStore.premise}`}
            >
              <h3 className="text-base font-extrabold text-fg leading-snug group-hover:text-primary transition-colors">{recommendedStore.premise}</h3>
              <p className="text-[10px] text-muted/50 leading-relaxed font-medium group-hover:text-muted/70 transition-colors">{recommendedStore.address || 'Location data not available'}</p>
            </a>

            <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-muted/50 uppercase tracking-wider">Store Total</span>
                <div className="text-sm font-black text-primary">RM {recommendedStore.total.toFixed(2)}</div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[9px] font-bold text-muted/50 uppercase tracking-wider">
                  {recommendedStore.distance_km != null ? 'Distance' : 'Availability'}
                </span>
                {recommendedStore.distance_km != null ? (
                  <div className="flex items-center justify-end gap-1 text-xs font-bold text-primary">
                    <Navigation className="w-3 h-3" />
                    {formatDistance(recommendedStore.distance_km, recommendedStore.distance_source)}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-fg">{recommendedStore.items_found} of {totalItemsCount} items</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. Retailer Rankings list */}
      {otherStores.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2.5 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted/60" style={{ letterSpacing: '0.08em' }}>
            Alternative Store Prices
          </div>
          <div className="bg-glass-card-bg/15 border border-glass-border rounded-2xl overflow-hidden divide-y divide-border/30">
            {otherStores.map((store, index) => {
              const rank = index + 2
              const diffPrice = store.total - result.total
              
              return (
                <div key={store.premise_code} className="p-4 flex items-center justify-between gap-4">
                  <a
                    href={storeMapsUrl(store)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 group cursor-pointer"
                    title={`Directions to ${store.premise}`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-bold text-muted/40 font-mono">#{rank}</span>
                      <h4 className="text-xs font-bold text-fg truncate leading-normal group-hover:text-primary transition-colors">{store.premise}</h4>
                    </div>
                    <p className="text-[9px] text-muted/50 truncate mt-0.5 group-hover:text-muted/70 transition-colors">{store.address || 'Location not available'}</p>
                  </a>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-fg">RM {store.total.toFixed(2)}</div>
                    {store.distance_km != null ? (
                      <div className="text-[8px] font-bold text-primary/80 font-mono mt-0.5">{formatDistance(store.distance_km, store.distance_source)} away</div>
                    ) : diffPrice > 0 ? (
                      <div className="text-[8px] font-bold text-red-400 font-mono mt-0.5">+RM {diffPrice.toFixed(2)}</div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
