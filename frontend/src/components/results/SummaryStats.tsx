'use client'

import { CheckCircle, TrendingUp, AlertTriangle, MapPin, Navigation } from 'lucide-react'
import type { BasketItemResult } from '@/lib/types'

interface SummaryStatsProps {
  total: number
  savings: number
  matchedCount: number
  totalCount: number
  unresolvedCount: number
  cheapestPremise: string | null
  cheapestPremiseState?: string | null
  cheapestPremiseAddress?: string | null
  items: BasketItemResult[]
  selectedState?: string
  isSingleStore?: boolean
  bestStoreItemsCovered?: number
}


export function SummaryStats({
  total,
  savings,
  matchedCount,
  totalCount,
  unresolvedCount,
  cheapestPremise,
  cheapestPremiseState = null,
  cheapestPremiseAddress = null,
  items,
  selectedState = '',
  isSingleStore = true,
  bestStoreItemsCovered,
}: SummaryStatsProps) {
  const totalItems = totalCount
  // Clamp unresolved to submitted count — LLM may hallucinate extras beyond what user submitted
  const displayUnresolved = Math.max(0, totalCount - matchedCount)
  const displayState = cheapestPremiseState ?? selectedState ?? null

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      
      {/* ── Best Total Card ─────────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-40">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Best Total
        </div>
        <div className={`font-mono text-3xl font-extrabold my-auto ${matchedCount === 0 ? 'text-muted/40' : isSingleStore ? 'text-primary' : 'text-warning'}`}>
          {matchedCount === 0 ? '—' : `RM ${total.toFixed(2)}`}
        </div>
        <div className="text-xs text-muted/80 flex items-center gap-1">
          {matchedCount === 0 ? (
            <span className="text-muted/40">No items priced</span>
          ) : isSingleStore ? (
            <>
              <MapPin size={12} className="text-primary" />
              <span>{displayState ?? 'Malaysia'}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={12} className="text-warning" />
              <span className="text-warning/80">
                {bestStoreItemsCovered != null ? `${bestStoreItemsCovered}/${matchedCount} items at one store` : 'Split across stores'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── You Save Card ───────────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-40">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          You Save
        </div>
        <div className="font-mono text-3xl font-extrabold text-primary my-auto flex items-center gap-2">
          {savings > 0 ? `RM ${savings.toFixed(2)}` : '—'}
          {savings > 0 && <TrendingUp size={20} className="text-primary" />}
        </div>
        <div className="text-xs text-muted/60">
          {selectedState ? `vs avg in ${selectedState}` : 'vs regional average'}
        </div>
      </div>

      {/* ── Items Matched Card ───────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-40">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Items Matched
        </div>
        <div className="font-mono text-3xl font-extrabold text-fg my-auto">
          {matchedCount}/{totalItems}
        </div>
        <div className={`text-xs flex items-center gap-1 ${displayUnresolved > 0 ? 'text-error' : 'text-primary'}`}>
          {displayUnresolved > 0 ? (
            <>
              <AlertTriangle size={12} />
              <span>{displayUnresolved} unmatched item{displayUnresolved !== 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <CheckCircle size={12} />
              <span>All matched</span>
            </>
          )}
        </div>
      </div>

      {/* ── Best Store Card ─────────────────────────────────────────────────── */}
      <div
        className="glass-card p-6 rounded-xl flex flex-col justify-between h-40 group relative overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
        title={cheapestPremiseAddress ?? undefined}
      >
        {/* Subtle glowing ambient gradient behind card on hover */}
        <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none" />

        <div className="flex justify-between items-start z-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Best Store
          </div>
          {cheapestPremise && cheapestPremiseAddress && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${cheapestPremise}, ${cheapestPremiseAddress}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Directions to ${cheapestPremiseAddress}`}
              className="text-muted hover:text-primary transition-all p-1.5 -m-1.5 rounded-lg hover:bg-overlay-sm active:scale-90 transform duration-150 cursor-pointer"
            >
              <Navigation size={13} className="group-hover:rotate-45 transition-transform duration-300" />
            </a>
          )}
        </div>

        <div className="z-10 text-base font-bold text-fg uppercase tracking-tight my-auto line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
          {cheapestPremise ?? '—'}
        </div>

        <div className="z-10 flex justify-between items-end text-xs text-muted/60">
          <div>{displayState ? `${displayState}` : 'Malaysia'}</div>
          {cheapestPremise && cheapestPremiseAddress && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${cheapestPremise}, ${cheapestPremiseAddress}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Directions to ${cheapestPremiseAddress}`}
              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 cursor-pointer"
            >
              <span>Directions</span>
              <span className="text-xs">→</span>
            </a>
          )}
        </div>
      </div>

    </section>
  )
}
