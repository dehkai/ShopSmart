'use client'

import { ChevronRight } from 'lucide-react'
import type { BasketItemResult, ItemMatch } from '@/lib/types'

interface MobileItemsViewProps {
  items: BasketItemResult[]
  matches: ItemMatch[]
  onItemClick: (item: BasketItemResult) => void
}

export function MobileItemsView({ items, matches, onItemClick }: MobileItemsViewProps) {
  // Find match details for a given item
  const getMatchInfo = (name: string) => {
    return matches.find((m) => m.item_name === name || m.query === name) || null
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto pb-24 h-full">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-fg tracking-tight">Grocery Matcher</h2>
        <p className="text-[11px] text-muted leading-relaxed">
          Tap any item to see alternative store prices and AI match details.
        </p>
      </div>

      {/* Items List */}
      <div className="bg-glass-card-bg/15 border border-glass-border rounded-2xl overflow-hidden divide-y divide-border/30">
        {items.map((item) => {
          const matchInfo = getMatchInfo(item.item_name)
          const confidence = matchInfo?.confidence ?? 1.0
          const confidencePct = Math.round(confidence * 100)
          
          return (
            <button
              key={item.item_code}
              type="button"
              onClick={() => onItemClick(item)}
              className="w-full p-4 flex items-center justify-between gap-4 text-left pwa-list-item cursor-pointer"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-fg truncate leading-normal">
                    {item.item_name}
                  </span>
                  {matchInfo?.match_type === 'llm' && (
                    <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase scale-90 origin-left select-none pointer-events-none">
                      AI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted/60">
                  <span className="truncate max-w-[150px]">
                    {item.cheapest?.premise || 'Searching...'}
                  </span>
                  <span>·</span>
                  <span className={`font-semibold ${confidence > 0.85 ? 'text-primary' : 'text-amber-400'}`}>
                    {confidencePct}% match
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-black text-fg">
                    RM {item.cheapest?.price.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-[8px] text-muted/40 font-mono mt-0.5">cheapest</div>
                </div>
                <ChevronRight className="w-4 h-4 text-subtle opacity-50" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
