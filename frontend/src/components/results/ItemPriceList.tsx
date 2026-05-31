'use client'

import { useState } from 'react'
import type { BasketItemResult } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'

interface ItemPriceListProps {
  items: BasketItemResult[]
}

function computeVariancePct(price: number, avg: number): number {
  if (avg === 0) return 0
  return ((price - avg) / avg) * 100
}

export function ItemPriceList({ items }: ItemPriceListProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  function toggle(i: number) {
    setExpandedIdx(expandedIdx === i ? null : i)
  }

  // Average price across items that have cheapest data
  const pricesWithData = items.filter((i) => i.cheapest !== null)
  const avgPrice =
    pricesWithData.length > 0
      ? pricesWithData.reduce((sum, i) => sum + i.cheapest!.price, 0) /
        pricesWithData.length
      : 0

  return (
    <GlassCard padding="sm" className="overflow-hidden">
      <p
        className="text-xs font-semibold uppercase tracking-widest px-3 pt-3 pb-2"
        style={{ color: '#c4c6d0', letterSpacing: '0.1em' }}
      >
        Per-item cheapest price
      </p>

      <ul>
        {items.map((item, i) => {
          const isOpen = expandedIdx === i
          const hasCheapest = item.cheapest !== null
          const variancePct = hasCheapest
            ? computeVariancePct(item.cheapest!.price, avgPrice)
            : null

          return (
            <li
              key={item.item_code}
              style={{
                borderTop:
                  i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
              }}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full text-left px-3 py-3 flex items-center justify-between gap-3
                  transition-colors hover:bg-white/[0.03] focus-visible:outline-none
                  focus-visible:bg-white/[0.05]"
                aria-expanded={isOpen}
              >
                <span
                  className="flex-1 min-w-0 text-sm truncate font-medium"
                  title={item.item_name}
                  style={{ color: '#e2e2e6' }}
                >
                  {item.item_name}
                </span>

                <span className="flex items-center gap-3 shrink-0">
                  {hasCheapest ? (
                    <>
                      <span
                        className="mono text-sm font-semibold"
                        style={{ color: '#22c55e' }}
                      >
                        RM {item.cheapest!.price.toFixed(2)}
                      </span>

                      {/* Variance chip */}
                      {variancePct !== null && pricesWithData.length > 1 && (
                        <span
                          className="mono text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background:
                              variancePct <= 0
                                ? 'rgba(34,197,94,0.10)'
                                : 'rgba(251,191,36,0.10)',
                            color:
                              variancePct <= 0 ? '#22c55e' : '#fbbf24',
                            border:
                              variancePct <= 0
                                ? '1px solid rgba(34,197,94,0.22)'
                                : '1px solid rgba(251,191,36,0.22)',
                          }}
                        >
                          {variancePct > 0 ? '+' : ''}
                          {variancePct.toFixed(0)}%
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                      No price data
                    </span>
                  )}
                  <span
                    className="text-xs transition-transform duration-200"
                    style={{
                      color: '#8e9099',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      display: 'inline-block',
                    }}
                  >
                    ▾
                  </span>
                </span>
              </button>

              {/* Expandable detail */}
              <div
                style={{
                  maxHeight: isOpen ? '200px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.25s ease',
                }}
              >
                {hasCheapest && (
                  <div
                    className="px-3 pb-3 pt-1"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="rounded-lg p-3 flex flex-col gap-1"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{ color: '#e2e2e6' }}
                      >
                        {item.cheapest!.premise}
                      </p>
                      <p className="text-xs" style={{ color: '#8e9099' }}>
                        {item.cheapest!.state}
                      </p>
                      <p
                        className="mono text-sm mt-1"
                        style={{ color: '#22c55e' }}
                      >
                        RM {item.cheapest!.price.toFixed(2)}
                      </p>
                      {variancePct !== null && pricesWithData.length > 1 && (
                        <p className="text-xs mt-0.5" style={{ color: '#8e9099' }}>
                          {variancePct <= 0
                            ? `${Math.abs(variancePct).toFixed(0)}% below avg`
                            : `${variancePct.toFixed(0)}% above avg`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </GlassCard>
  )
}
