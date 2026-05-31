'use client'

import { motion } from 'framer-motion'
import { CheckCircle, MapPin } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import type { BasketItemResult } from '@/lib/types'

interface SummaryStatsProps {
  total: number
  savings: number
  matchedCount: number
  unresolvedCount: number
  cheapestPremise: string | null
  items: BasketItemResult[]
}

const EASE = [0.16, 1, 0.3, 1] as const

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: EASE },
  },
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
  unresolvedCount,
  cheapestPremise,
  items,
}: SummaryStatsProps) {
  const totalItems = matchedCount + unresolvedCount
  const topState = deriveTopState(items)

  return (
    <div className="flex flex-col gap-4">

      {/* ── Hero totals banner ──────────────────────────────────────────── */}
      <motion.div
        className="glass p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{
          borderRadius: '16px',
          background: 'rgba(34,197,94,0.04)',
          borderColor: 'rgba(34,197,94,0.18)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >

        {/* Best total */}
        <div className="flex flex-col items-center sm:items-start gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#22c55e', letterSpacing: '0.12em' }}
            >
              Best total
            </span>
            <span className="chip-verified">
              <CheckCircle size={10} strokeWidth={2.5} />
              verified
            </span>
          </div>
          <span
            className="mono font-extrabold"
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.8rem)',
              color: '#22c55e',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            RM {total.toFixed(2)}
          </span>
          {topState && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(34,197,94,0.08)',
                color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.18)',
              }}
            >
              <MapPin size={10} strokeWidth={2} />
              {topState}
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          className="hidden sm:block w-px h-16"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />

        {/* You save */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#60a5fa', letterSpacing: '0.12em' }}
          >
            You save
          </span>
          <span
            className="mono font-extrabold text-4xl"
            style={{
              color: savings > 0 ? '#60a5fa' : '#44474e',
              letterSpacing: '-0.03em',
            }}
          >
            {savings > 0 ? `RM ${savings.toFixed(2)}` : '—'}
          </span>
          <span className="text-xs" style={{ color: '#8e9099' }}>
            vs most expensive basket
          </span>
        </div>

        {/* Divider */}
        <div
          className="hidden sm:block w-px h-16"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />

        {/* Items matched */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#8e9099', letterSpacing: '0.12em' }}
          >
            Items matched
          </span>
          <span
            className="mono font-extrabold text-4xl"
            style={{
              color: unresolvedCount > 0 ? '#fbbf24' : '#22c55e',
              letterSpacing: '-0.03em',
            }}
          >
            {matchedCount}/{totalItems}
          </span>
          {unresolvedCount > 0 && (
            <span className="text-xs" style={{ color: '#fbbf24' }}>
              ⚠ {unresolvedCount} not found
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          className="hidden sm:block w-px h-16"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />

        {/* Cheapest store */}
        <div className="flex flex-col items-center sm:items-end gap-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#8e9099', letterSpacing: '0.12em' }}
          >
            Best store
          </span>
          {cheapestPremise ? (
            <>
              <span
                className="flex items-center gap-1.5 text-sm font-semibold text-center sm:text-right"
                style={{ color: '#e2e2e6', maxWidth: '16ch', lineHeight: 1.3 }}
              >
                <MapPin
                  size={13}
                  strokeWidth={2}
                  style={{ color: '#60a5fa', flexShrink: 0 }}
                />
                {cheapestPremise}
              </span>
              {topState && (
                <span className="text-xs" style={{ color: '#8e9099' }}>
                  {topState} Region
                </span>
              )}
            </>
          ) : (
            <span className="text-2xl font-bold" style={{ color: '#44474e' }}>
              —
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Stat cards row ──────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={cardVariants}>
          <StatCard
            label="Cheapest basket"
            value={`RM ${total.toFixed(2)}`}
            subtext="across all matched items"
            accent="green"
            mono
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <StatCard
            label="Savings vs worst"
            value={savings > 0 ? `RM ${savings.toFixed(2)}` : '—'}
            subtext={
              savings > 0 ? 'vs most expensive basket' : 'no comparison data'
            }
            accent="blue"
            mono
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <StatCard
            label="Items matched"
            value={`${matchedCount} / ${totalItems}`}
            subtext={
              unresolvedCount > 0
                ? `${unresolvedCount} not found`
                : 'all resolved'
            }
            accent={unresolvedCount > 0 ? 'white' : 'green'}
          />
        </motion.div>
        <motion.div variants={cardVariants}>
          <StatCard
            label="Best single store"
            value={cheapestPremise ?? '—'}
            subtext={
              cheapestPremise ? 'cheapest for full basket' : 'no data'
            }
            accent="green"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
