'use client'

import { CheckCircle, TrendingUp, AlertTriangle, MapPin } from 'lucide-react'
import type { BasketItemResult } from '@/lib/types'

interface SummaryStatsProps {
  total: number
  savings: number
  matchedCount: number
  totalCount: number
  unresolvedCount: number
  cheapestPremise: string | null
  items: BasketItemResult[]
  selectedState?: string
  isSingleStore?: boolean
  bestStoreItemsCovered?: number
}

/** Most frequent state across cheapest prices */
function deriveTopState(items: BasketItemResult[]): string | null {
  const counts: Record<string, number> = {}
  for (const item of items) {
    if (item.cheapest?.state) {
      counts[item.cheapest.state] = (counts[item.cheapest.state] ?? 0) + 1
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top ? top[0] : null
}

export function SummaryStats({
  total,
  savings,
  matchedCount,
  totalCount,
  unresolvedCount,
  cheapestPremise,
  items,
  selectedState = '',
  isSingleStore = true,
  bestStoreItemsCovered,
}: SummaryStatsProps) {
  const totalItems = totalCount
  // Clamp unresolved to submitted count — LLM may hallucinate extras beyond what user submitted
  const displayUnresolved = Math.max(0, totalCount - matchedCount)
  const topState = deriveTopState(items)

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      
      {/* ── Best Total Card ─────────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-40">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#bccbb9]">
          Best Total
        </div>
        <div className={`font-mono text-3xl font-extrabold my-auto ${isSingleStore ? 'text-[#22c55e]' : 'text-[#facc15]'}`}>
          RM {total.toFixed(2)}
        </div>
        <div className="text-xs text-[#bccbb9]/80 flex items-center gap-1">
          {isSingleStore ? (
            <>
              <MapPin size={12} className="text-[#22c55e]" />
              <span>{topState ?? 'Malaysia'}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={12} className="text-[#facc15]" />
              <span className="text-[#facc15]/80">
                {bestStoreItemsCovered != null ? `${bestStoreItemsCovered}/${matchedCount} items at one store` : 'Split across stores'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── You Save Card ───────────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-40">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#bccbb9]">
          You Save
        </div>
        <div className="font-mono text-3xl font-extrabold text-[#22c55e] my-auto flex items-center gap-2">
          {savings > 0 ? `RM ${savings.toFixed(2)}` : '—'}
          {savings > 0 && <TrendingUp size={20} className="text-[#22c55e]" />}
        </div>
        <div className="text-xs text-[#bccbb9]/60">
          {selectedState ? `vs avg in ${selectedState}` : 'vs regional average'}
        </div>
      </div>

      {/* ── Items Matched Card ───────────────────────────────────────────────── */}
      <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-40">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#bccbb9]">
          Items Matched
        </div>
        <div className="font-mono text-3xl font-extrabold text-[#dee1f7] my-auto">
          {matchedCount}/{totalItems}
        </div>
        <div className={`text-xs flex items-center gap-1 ${displayUnresolved > 0 ? 'text-[#ffb5ab]' : 'text-[#22c55e]'}`}>
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
      <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-40">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#bccbb9]">
          Best Store
        </div>
        <div className="text-base font-bold text-[#dee1f7] uppercase tracking-tight my-auto line-clamp-2 leading-tight">
          {cheapestPremise ?? '—'}
        </div>
        <div className="text-xs text-[#bccbb9]/60">
          {topState ? `${topState}` : 'Malaysia'}
        </div>
      </div>

    </section>
  )
}
