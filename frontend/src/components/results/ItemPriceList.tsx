'use client'

import type { BasketItemResult } from '@/lib/types'

interface ItemPriceListProps {
  items: BasketItemResult[]
}

export function ItemPriceList({ items }: ItemPriceListProps) {
  const pricesWithData = items.filter((i) => i.cheapest !== null)
  
  const avgPrice =
    pricesWithData.length > 0
      ? pricesWithData.reduce((sum, i) => sum + i.cheapest!.price, 0) /
        pricesWithData.length
      : 0

  return (
    <div className="glass-card rounded-xl overflow-hidden shadow-2xl">
      
      {/* Table Header Section */}
      <div className="p-8 border-b border-white/10 bg-[#090e1c]/50">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#bccbb9] mb-1">
          Detailed Price Breakdown
        </h3>
        <p className="text-xs text-[#bccbb9]/60">
          Item-by-item comparison across regional stores
        </p>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-[#bccbb9] border-b border-white/10">
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
              
              // Calculate variance from overall average
              let variance = 0
              if (hasCheapest && avgPrice > 0) {
                variance = cheapest.price - avgPrice
              }

              return (
                <tr
                  key={item.item_code ?? `item-${idx}`}
                  className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors
                    ${
                      hasCheapest && idx === 0
                        ? 'bg-[#22c55e]/5 border-l-4 border-l-[#22c55e]'
                        : 'border-l-4 border-l-transparent'
                    }`}
                >
                  {/* Item Name */}
                  <td className="px-8 py-5 font-semibold text-[#dee1f7]">
                    {item.item_name}
                  </td>
                  
                  {/* Cheapest Store */}
                  <td className="px-8 py-5 text-[#bccbb9]">
                    {cheapest?.premise ?? (
                      <span className="text-[#bccbb9]/30 italic">No store found</span>
                    )}
                  </td>
                  
                  {/* State */}
                  <td className="px-8 py-5 text-[#bccbb9]">
                    {cheapest?.state ?? (
                      <span className="text-[#bccbb9]/30">—</span>
                    )}
                  </td>
                  
                  {/* Best Price */}
                  <td className={`px-8 py-5 font-bold font-mono text-sm ${hasCheapest ? 'text-[#22c55e]' : 'text-[#bccbb9]'}`}>
                    {cheapest ? `RM ${cheapest.price.toFixed(2)}` : '—'}
                  </td>
                  
                  {/* vs Average */}
                  <td className="px-8 py-5 text-right font-mono">
                    {hasCheapest && pricesWithData.length > 1 ? (
                      variance <= 0 ? (
                        <span className="bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          - RM {Math.abs(variance).toFixed(2)}
                        </span>
                      ) : (
                        <span className="bg-[#ffb5ab]/15 text-[#ffb5ab] border border-[#ffb5ab]/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          + RM {variance.toFixed(2)}
                        </span>
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
