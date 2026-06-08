'use client'

import type { StateRanking, StoreRanking } from '@/lib/types'

interface StateChartProps {
  stateRanking: StateRanking[]
  storeRanking?: StoreRanking[]
  selectedState?: string
  /** avg(all stores in state) – used as reference line in store mode */
  averageTotal?: number
  /** avg basket price across all stores nationally */
  nationalAverage?: number
  totalItemCount?: number
}

// ── State mode (no state selected) ──────────────────────────────────────────

function StateMode({ stateRanking, nationalAverage }: { stateRanking: StateRanking[], nationalAverage?: number }) {
  const top5 = stateRanking.slice(0, 5)
  const scaleMax = Math.max(
    ...top5.map((r) => r.total),
    nationalAverage ?? 0,
  )

  return (
    <div className="glass-card p-8 rounded-xl flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#bccbb9] mb-1">
            Total Basket Cost by State
          </h3>
          <p className="text-xs text-[#bccbb9]/60">Cheapest single store per state, top 5</p>
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-6">
        {top5.map((row, idx) => {
          const isCheapest = idx === 0
          const barWidth = Math.max(10, (row.total / scaleMax) * 100)

          return (
            <div key={row.state} className="flex items-center gap-4">
              <div className="w-28 text-right text-xs font-semibold text-[#dee1f7]">
                {row.state}
              </div>
              <div className="flex-grow h-6 bg-white/5 rounded-full relative overflow-hidden">
                {nationalAverage && nationalAverage > 0 && (
                  <div
                    className="absolute top-0 h-full w-0.5 border-l-2 border-dashed border-[#facc15]/50 z-10"
                    style={{ left: `${(nationalAverage / scaleMax) * 100}%` }}
                  />
                )}
                <div
                  className={`bar-grow absolute h-full rounded-full transition-all duration-1000 ${isCheapest
                      ? 'bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                      : 'bg-white/15'
                    }`}
                  style={{ width: `${barWidth}%`, animationDelay: `${idx * 0.1}s` }}
                />
              </div>
              <div
                className={`w-20 text-xs font-bold font-mono text-right ${isCheapest ? 'text-[#22c55e]' : 'text-[#bccbb9]'
                  }`}
              >
                RM {row.total.toFixed(2)}
              </div>
            </div>
          )
        })}

        {nationalAverage && nationalAverage > 0 && (
          <div className="flex items-center gap-4 opacity-60">
            <div className="w-28 text-right text-[10px] font-semibold text-[#facc15] uppercase tracking-wide">
              National Avg
            </div>
            <div className="flex-grow h-6 bg-white/5 rounded-full relative overflow-hidden">
              <div
                className="absolute h-full rounded-full border-2 border-dashed border-[#facc15]/60 bg-transparent"
                style={{ width: `${(nationalAverage / scaleMax) * 100}%` }}
              />
            </div>
            <div className="w-20 text-xs font-bold font-mono text-right text-[#facc15]">
              RM {nationalAverage.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Store mode (state selected) ──────────────────────────────────────────────

function StoreMode({
  storeRanking,
  selectedState,
  itemCount,
  averageTotal,
}: {
  storeRanking: StoreRanking[]
  selectedState: string
  itemCount: number
  averageTotal?: number
}) {
  if (storeRanking.length === 0) {
    return (
      <div className="glass-card p-8 rounded-xl flex flex-col justify-center items-center gap-3 min-h-[220px]">
        <p className="text-sm text-[#bccbb9]/60">No stores found in {selectedState} for this basket.</p>
      </div>
    )
  }

  // Scale bars against state average if available (so avg bar = 100%), otherwise use max store price
  const scaleMax = averageTotal && averageTotal > 0
    ? Math.max(averageTotal, ...storeRanking.map((r) => r.total))
    : Math.max(...storeRanking.map((r) => r.total))

  const savings = averageTotal && storeRanking[0]
    ? averageTotal - storeRanking[0].total
    : null

  return (
    <div className="glass-card p-8 rounded-xl flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[#bccbb9] mb-1">
            Cheapest Stores in {selectedState}
          </h3>
          <p className="text-xs text-[#bccbb9]/60">
            Top {storeRanking.length} store{storeRanking.length !== 1 ? 's' : ''} for your basket
          </p>
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-5">
        {storeRanking.map((row, idx) => {
          const isBest = idx === 0
          const barWidth = Math.max(10, (row.total / scaleMax) * 100)
          const hasPartialStock = row.items_found < itemCount

          return (
            <div key={row.premise_code} className="flex items-center gap-4">
              <div className="w-28 text-right flex flex-col items-end">
                <span className={`text-xs leading-tight line-clamp-2 ${isBest ? 'font-extrabold text-white' : 'font-semibold text-[#dee1f7]'}`}>
                  {row.premise}
                </span>
                {hasPartialStock && (
                  <span className="text-[10px] text-[#ffb5ab]/70">
                    {row.items_found}/{itemCount} items
                  </span>
                )}
              </div>

              <div className="flex-grow h-6 bg-white/5 rounded-full relative overflow-hidden">
                {/* State average reference line */}
                {averageTotal && (
                  <div
                    className="absolute top-0 h-full w-0.5 border-l-2 border-dashed border-[#facc15]/50 z-10"
                    style={{ left: `${(averageTotal / scaleMax) * 100}%` }}
                  />
                )}
                <div
                  className={`bar-grow absolute h-full rounded-full transition-all duration-1000 ${isBest
                      ? 'bg-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                      : 'bg-white/15'
                    }`}
                  style={{ width: `${barWidth}%`, animationDelay: `${idx * 0.1}s` }}
                />
              </div>

              <div
                className={`w-20 font-mono text-right ${isBest ? 'text-sm font-extrabold text-[#22c55e]' : 'text-xs font-bold text-[#bccbb9]'}`}
              >
                RM {row.total.toFixed(2)}
              </div>
            </div>
          )
        })}

        {/* State average row */}
        {averageTotal && (
          <div className="flex items-center gap-4 opacity-60">
            <div className="w-28 text-right text-[10px] font-semibold text-[#facc15] uppercase tracking-wide">
              State Avg
            </div>
            <div className="flex-grow h-6 bg-white/5 rounded-full relative overflow-hidden">
              <div
                className="absolute h-full rounded-full border-2 border-dashed border-[#facc15]/60 bg-transparent"
                style={{ width: `${(averageTotal / scaleMax) * 100}%` }}
              />
            </div>
            <div className="w-20 text-xs font-bold font-mono text-right text-[#facc15]">
              RM {averageTotal.toFixed(2)}
            </div>
          </div>
        )}

        {savings !== null && savings > 0 && (
          <p className="text-xs text-[#22c55e]/70 mt-1">
            💡 {storeRanking[0].premise} saves RM {savings.toFixed(2)} vs state average
          </p>
        )}
      </div>
    </div>
  )
}

// ── Root component ───────────────────────────────────────────────────────────

export function StateChart({
  stateRanking,
  storeRanking = [],
  selectedState = '',
  averageTotal,
  nationalAverage,
  totalItemCount,
}: StateChartProps) {
  const hasStateFilter = selectedState.trim().length > 0

  if (hasStateFilter) {
    const itemCount = totalItemCount ?? (
      storeRanking.length > 0
        ? Math.max(...storeRanking.map((r) => r.items_found))
        : 0
    )

    return (
      <StoreMode
        storeRanking={storeRanking}
        selectedState={selectedState}
        itemCount={itemCount}
        averageTotal={averageTotal}
      />
    )
  }

  if (!stateRanking || stateRanking.length === 0) {
    return (
      <div className="glass-card p-8 rounded-xl flex flex-col justify-center items-center gap-3 min-h-[220px]">
        <p className="text-sm text-[#bccbb9]/60">No pricing data available — no items were matched.</p>
      </div>
    )
  }

  return <StateMode stateRanking={stateRanking} nationalAverage={nationalAverage} />
}
