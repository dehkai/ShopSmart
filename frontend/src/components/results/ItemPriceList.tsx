'use client'

import type { BasketItemResult } from '@/lib/types'

interface ItemPriceListProps {
  items: BasketItemResult[]
  recommendedStore?: string
  selectedState?: string
}

// ── National view (no state selected) ────────────────────────────────────────

function DetailedBreakdown({ items }: { items: BasketItemResult[] }) {
  const pricesWithData = items.filter((i) => i.cheapest !== null)
  const avgPrice =
    pricesWithData.length > 0
      ? pricesWithData.reduce((sum, i) => sum + i.cheapest!.price, 0) / pricesWithData.length
      : 0

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-8 border-b border-border bg-surface-dim/50">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted mb-1">
          Detailed Price Breakdown
        </h3>
        <p className="text-xs text-muted/60">
          Item-by-item comparison across regional stores
        </p>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[820px]">
          <thead>
            <tr className="bg-overlay-xs text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border">
              <th className="px-8 py-4">Item Name</th>
              <th className="px-8 py-4">Cheapest Store</th>
              <th className="px-8 py-4">State</th>
              <th className="px-8 py-4">Best Price</th>
              <th className="px-8 py-4 text-right">vs Average</th>
            </tr>
          </thead>

          <tbody className="text-xs">
            {items.map((item, idx) => {
              const cheapest = item.cheapest
              const hasCheapest = cheapest !== null
              let variance = 0
              if (hasCheapest && avgPrice > 0) {
                variance = cheapest.price - avgPrice
              }

              return (
                <tr
                  key={item.item_code ?? `item-${idx}`}
                  className={`border-b border-border/30 hover:bg-overlay-sm transition-colors ${
                    hasCheapest && idx === 0
                      ? 'bg-primary/5 border-l-4 border-l-primary'
                      : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <td className="px-8 py-5 font-semibold text-fg">{item.item_name}</td>
                  <td className="px-8 py-5 text-muted">
                    {cheapest?.premise ?? <span className="text-muted/30 italic">No store found</span>}
                  </td>
                  <td className="px-8 py-5 text-muted">
                    {cheapest?.state ?? <span className="text-muted/30">—</span>}
                  </td>
                  <td className={`px-8 py-5 font-bold font-mono text-sm whitespace-nowrap ${hasCheapest ? 'text-primary' : 'text-muted'}`}>
                    {cheapest ? `RM ${cheapest.price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-8 py-5 text-right font-mono">
                    {hasCheapest && pricesWithData.length > 1 ? (
                      variance <= 0 ? (
                        <span className="inline-block whitespace-nowrap bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          - RM {Math.abs(variance).toFixed(2)}
                        </span>
                      ) : (
                        <span className="inline-block whitespace-nowrap bg-error/15 text-error border border-error/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          + RM {variance.toFixed(2)}
                        </span>
                      )
                    ) : (
                      <span className="text-muted/30">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── State view (state selected) ───────────────────────────────────────────────

function ConveniencePremium({ items, recommendedStore }: { items: BasketItemResult[], recommendedStore?: string }) {
  const totalConveniencePremium = items.reduce((sum, item) => {
    if (item.store_price != null && item.cheapest) {
      return sum + Math.max(0, item.store_price - item.cheapest.price)
    }
    return sum
  }, 0)

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-8 border-b border-border bg-surface-dim/50 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted mb-1">
            Convenience Premium Analysis
          </h3>
          <p className="text-xs text-muted/60">
            {recommendedStore
              ? `Prices at ${recommendedStore} vs cheapest alternative per item`
              : 'Price at recommended store vs cheapest alternative per item'}
          </p>
        </div>
        {items.some(i => i.store_price != null) && (
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-muted/50 mb-0.5">Total Premium</p>
            {totalConveniencePremium > 0 ? (
              <>
                <p className="text-lg font-bold font-mono text-error">
                  + RM {totalConveniencePremium.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted/40">to shop one store</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-mono text-primary">RM 0.00</p>
                <p className="text-[10px] text-muted/40">already optimal</p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-overlay-xs text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border">
              <th className="px-8 py-4">Item Name</th>
              <th className="px-8 py-4">Price at Best Store</th>
              <th className="px-8 py-4">Absolute Best Price</th>
              <th className="px-8 py-4">Convenience Cost</th>
              <th className="px-8 py-4">Cheapest Alternative</th>
            </tr>
          </thead>

          <tbody className="text-xs">
            {items.map((item, idx) => {
              const storePrice = item.store_price
              const cheapest = item.cheapest
              const premium = storePrice != null && cheapest
                ? storePrice - cheapest.price
                : null
              const isMatch = premium !== null && Math.abs(premium) < 0.005

              return (
                <tr
                  key={item.item_code ?? `item-${idx}`}
                  className={`border-b border-border/30 hover:bg-overlay-sm transition-colors border-l-4 ${
                    isMatch
                      ? 'border-l-primary/40'
                      : premium && premium > 0
                      ? 'border-l-error/40'
                      : 'border-l-transparent'
                  }`}
                >
                  <td className="px-8 py-5 font-semibold text-fg">{item.item_name}</td>

                  <td className="px-8 py-5 font-bold font-mono text-sm whitespace-nowrap text-fg">
                    {storePrice != null
                      ? `RM ${storePrice.toFixed(2)}`
                      : <span className="text-muted/30">—</span>}
                  </td>

                  <td className="px-8 py-5 font-mono whitespace-nowrap text-primary">
                    {cheapest
                      ? `RM ${cheapest.price.toFixed(2)}`
                      : <span className="text-muted/30">—</span>}
                  </td>

                  <td className="px-8 py-5 font-mono">
                    {premium === null ? (
                      <span className="text-muted/30">—</span>
                    ) : isMatch ? (
                      <span className="inline-block whitespace-nowrap bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Match
                      </span>
                    ) : premium > 0 ? (
                      <span className="inline-block whitespace-nowrap bg-error/15 text-error border border-error/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        + RM {premium.toFixed(2)}
                      </span>
                    ) : (
                      <span className="inline-block whitespace-nowrap bg-primary/15 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Match
                      </span>
                    )}
                  </td>

                  <td className="px-8 py-5 text-muted">
                    {cheapest ? (
                      isMatch
                        ? <span className="text-muted/40 italic">Same store</span>
                        : cheapest.premise
                    ) : (
                      <span className="text-muted/30">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function ItemPriceList({ items, recommendedStore, selectedState }: ItemPriceListProps) {
  if (selectedState && selectedState.trim().length > 0) {
    return <ConveniencePremium items={items} recommendedStore={recommendedStore} />
  }
  return <DetailedBreakdown items={items} />
}
