'use client'

import type { BasketItemResult } from '@/lib/types'

interface ItemPriceListProps {
  items: BasketItemResult[]
  recommendedStore?: string
}

export function ItemPriceList({ items, recommendedStore }: ItemPriceListProps) {
  const totalConveniencePremium = items.reduce((sum, item) => {
    if (item.store_price != null && item.cheapest) {
      return sum + Math.max(0, item.store_price - item.cheapest.price)
    }
    return sum
  }, 0)

  return (
    <div className="glass-card rounded-xl overflow-hidden shadow-2xl">

      {/* Header */}
      <div className="p-8 border-b border-white/10 bg-[#090e1c]/50 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#bccbb9] mb-1">
            Convenience Premium Analysis
          </h3>
          <p className="text-xs text-[#bccbb9]/60">
            {recommendedStore
              ? `Prices at ${recommendedStore} vs cheapest alternative per item`
              : 'Price at recommended store vs cheapest alternative per item'}
          </p>
        </div>
        {totalConveniencePremium > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-[#bccbb9]/50 mb-0.5">Total Premium</p>
            <p className="text-lg font-bold font-mono text-[#ffb5ab]">
              + RM {totalConveniencePremium.toFixed(2)}
            </p>
            <p className="text-[10px] text-[#bccbb9]/40">to shop one store</p>
          </div>
        )}
        {totalConveniencePremium === 0 && items.some(i => i.store_price != null) && (
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-[#bccbb9]/50 mb-0.5">Total Premium</p>
            <p className="text-lg font-bold font-mono text-[#22c55e]">RM 0.00</p>
            <p className="text-[10px] text-[#bccbb9]/40">already optimal</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#bccbb9] border-b border-white/10">
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
                  className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors border-l-4 ${
                    isMatch
                      ? 'border-l-[#22c55e]/40'
                      : premium && premium > 0
                      ? 'border-l-[#ffb5ab]/40'
                      : 'border-l-transparent'
                  }`}
                >
                  {/* Item Name */}
                  <td className="px-8 py-5 font-semibold text-[#dee1f7]">
                    {item.item_name}
                  </td>

                  {/* Price at recommended store */}
                  <td className="px-8 py-5 font-bold font-mono text-sm text-[#dee1f7]">
                    {storePrice != null
                      ? `RM ${storePrice.toFixed(2)}`
                      : <span className="text-[#bccbb9]/30">—</span>
                    }
                  </td>

                  {/* Absolute best price */}
                  <td className="px-8 py-5 font-mono text-[#22c55e]">
                    {cheapest
                      ? `RM ${cheapest.price.toFixed(2)}`
                      : <span className="text-[#bccbb9]/30">—</span>
                    }
                  </td>

                  {/* Convenience premium */}
                  <td className="px-8 py-5 font-mono">
                    {premium === null ? (
                      <span className="text-[#bccbb9]/30">—</span>
                    ) : isMatch ? (
                      <span className="bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Match
                      </span>
                    ) : premium > 0 ? (
                      <span className="bg-[#ffb5ab]/15 text-[#ffb5ab] border border-[#ffb5ab]/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        + RM {premium.toFixed(2)}
                      </span>
                    ) : (
                      <span className="bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Match
                      </span>
                    )}
                  </td>

                  {/* Cheapest alternative store */}
                  <td className="px-8 py-5 text-[#bccbb9]">
                    {cheapest ? (
                      isMatch ? (
                        <span className="text-[#bccbb9]/40 italic">Same store</span>
                      ) : (
                        cheapest.premise
                      )
                    ) : (
                      <span className="text-[#bccbb9]/30">—</span>
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
