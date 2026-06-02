'use client'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import type { BasketResult } from '@/lib/types'
import { SummaryStats } from './SummaryStats'
import { StateChart } from './StateChart'
import { MatchesTable } from './MatchesTable'
import { ItemPriceList } from './ItemPriceList'

interface ResultsSectionProps {
  result: BasketResult
  onReset: () => void
  selectedState?: string
  submittedCount?: number
  className?: string
}

const EASE = [0.16, 1, 0.3, 1] as const

const childVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

export function ResultsSection({
  result,
  onReset,
  selectedState = '',
  submittedCount,
  className = '',
}: ResultsSectionProps) {
  const matchedItems = result.matches.filter((m) => m.resolved)
  // Prefer store_ranking[0] (cheapest single store for whole basket) over per-item cheapest
  const cheapestPremise =
    result.store_ranking?.[0]?.premise ??
    result.items.find((i) => i.cheapest)?.cheapest?.premise ??
    null

  // Use original submitted count as denominator; fall back to LLM output count
  const totalItems = submittedCount ?? (matchedItems.length + result.unresolved.length)

  return (
    <motion.section
      className={`flex flex-col gap-8 ${className}`}
      aria-label="Optimization results"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >

      {/* ── Page Header Section ────────────────────────────────────────────── */}
      {/* ── Page Header Section ────────────────────────────────────────────── */}
      <motion.header
        variants={childVariants}
        className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 select-none"
      >
        <div className="space-y-2">
          <h1 className="font-sans text-3xl font-extrabold text-[#22c55e] tracking-tight">
            Price Optimization
          </h1>
          <p className="text-[#bccbb9] text-sm">
            Based on your basket of {totalItems} item{totalItems !== 1 ? 's' : ''} across Malaysia&apos;s retailers.
          </p>
        </div>

        <button
          onClick={onReset}
          type="button"
          className="shimmer flex items-center gap-2 px-6 py-2.5 bg-[#22c55e] text-[#0e1322] rounded-xl font-bold shadow-lg shadow-[#22c55e]/20 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer self-start md:self-auto shrink-0"
        >
          <span>New Intelligence Search</span>
          <Search size={14} />
        </button>
      </motion.header>

      <motion.div variants={childVariants}>
        <SummaryStats
          total={result.total}
          savings={result.savings}
          matchedCount={matchedItems.length}
          totalCount={totalItems}
          unresolvedCount={result.unresolved.length}
          cheapestPremise={cheapestPremise}
          items={result.items}
          selectedState={selectedState}
          isSingleStore={result.is_single_store}
          bestStoreItemsCovered={result.store_ranking?.[0]?.items_found}
        />
      </motion.div>

      <motion.div
        variants={childVariants}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Left: Progress Chart (60% width) */}
        <div className="lg:col-span-8 h-full">
          <StateChart
            stateRanking={result.state_ranking ?? []}
            storeRanking={result.store_ranking ?? []}
            selectedState={selectedState}
            averageTotal={result.total + result.savings}
          />
        </div>

        <div className="lg:col-span-4 h-full">
          <MatchesTable
            matches={result.matches}
            unresolved={result.unresolved}
          />
        </div>
      </motion.div>

      {result.items.length > 0 && (
        <motion.div variants={childVariants} className="space-y-6">
          <ItemPriceList items={result.items} recommendedStore={cheapestPremise ?? undefined} />
        </motion.div>
      )}

    </motion.section>
  )
}
