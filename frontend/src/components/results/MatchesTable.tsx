'use client'

import { Edit, CheckCircle, AlertTriangle } from 'lucide-react'
import type { ItemMatch } from '@/lib/types'
import { CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_MID } from '@/lib/constants'

interface MatchesTableProps {
  matches: ItemMatch[]
  unresolved: string[]
}

function getConfidenceBadge(confidence: number) {
  if (confidence >= CONFIDENCE_THRESHOLD_HIGH) {
    return (
      <span className="px-3 py-1 bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-[10px] font-bold rounded-full uppercase tracking-wider">
        High
      </span>
    )
  }
  if (confidence >= CONFIDENCE_THRESHOLD_MID) {
    return (
      <span className="px-3 py-1 bg-yellow-500/15 border border-yellow-500/30 text-yellow-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
        Mid
      </span>
    )
  }
  return (
    <span className="px-3 py-1 bg-red-500/15 border border-red-500/30 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
      Low
    </span>
  )
}

export function MatchesTable({ matches, unresolved }: MatchesTableProps) {
  return (
    <div className="glass-card p-6 rounded-xl flex flex-col">
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#bccbb9] mb-1">
          Intelligence Match
        </h3>
        <p className="text-xs text-[#bccbb9]/60">
          Matching your list to PriceCatcher database items
        </p>
      </div>

      <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
        {/* Matched / Resolved Items */}
        {matches.map((match, idx) => (
          <div
            key={`match-${idx}`}
            className="flex justify-between items-center p-3 border-b border-white/5 last:border-0"
          >
            <div className="min-w-0 flex-1 pr-4">
              <div className="text-xs font-bold text-[#dee1f7] truncate" title={match.query}>
                {match.query}
              </div>
              <div className="text-[11px] text-[#bccbb9]/60 truncate mt-0.5" title={match.item_name ?? ''}>
                Matched: {match.item_name ?? 'Searching...'}
              </div>
            </div>
            
            <div className="shrink-0 flex items-center gap-2">
              {match.resolved ? (
                getConfidenceBadge(match.confidence)
              ) : (
                <span className="px-3 py-1 bg-white/5 border border-white/10 text-[#bccbb9]/50 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Unresolved / Not Found Items */}
        {unresolved.map((q, idx) => (
          <div
            key={`unresolved-${idx}`}
            className="flex justify-between items-center p-3 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02]"
          >
            <div className="min-w-0 flex-1 pr-4">
              <div className="text-xs font-bold text-[#dee1f7]/70 italic truncate">
                {q}
              </div>
              <div className="text-[11px] text-[#ffb5ab] flex items-center gap-1 mt-0.5">
                <AlertTriangle size={10} />
                <span>No price data found</span>
              </div>
            </div>

            <button
              type="button"
              className="shrink-0 px-3 py-1 text-[#bccbb9] hover:text-[#22c55e] transition-colors flex items-center gap-1 font-bold text-[10px] tracking-wider uppercase"
            >
              <Edit size={10} />
              <span>Edit</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
