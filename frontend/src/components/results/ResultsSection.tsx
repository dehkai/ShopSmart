'use client'

import { motion } from 'framer-motion'
import { Download, Search } from 'lucide-react'
import type { BasketResult } from '@/lib/types'
import { exportBasketCsv } from '@/lib/exportCsv'
import { Button } from '@/components/ui/Button'
import { SummaryStats } from './SummaryStats'
import { StateChart } from './StateChart'
import { MatchesTable } from './MatchesTable'
import { ItemPriceList } from './ItemPriceList'

interface ResultsSectionProps {
  result: BasketResult
  onReset: () => void
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
  className = '',
}: ResultsSectionProps) {
  const matchedItems = result.matches.filter((m) => m.resolved)
  const cheapestPremise =
    result.items.find((i) => i.cheapest)?.cheapest?.premise ?? null

  function handleCsvExport() {
    exportBasketCsv(result)
  }

  return (
    <motion.section
      className={`flex flex-col gap-6 ${className}`}
      aria-label="Optimization results"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── Action bar ──────────────────────────────────────────────────── */}
      <motion.div
        variants={childVariants}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <h2 className="font-semibold text-sm uppercase tracking-widest" style={{ color: '#8e9099', letterSpacing: '0.1em' }}>
          Optimization Results
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCsvExport}
            className="flex items-center gap-1.5"
          >
            <Download size={13} strokeWidth={2} />
            Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="flex items-center gap-1.5"
          >
            <Search size={13} strokeWidth={2} />
            New Search
          </Button>
        </div>
      </motion.div>

      {/* ── Summary stats ────────────────────────────────────────────────── */}
      <motion.div variants={childVariants}>
        <SummaryStats
          total={result.total}
          savings={result.savings}
          matchedCount={matchedItems.length}
          unresolvedCount={result.unresolved.length}
          cheapestPremise={cheapestPremise}
          items={result.items}
        />
      </motion.div>

      {result.items.length > 0 && (
        <motion.div variants={childVariants}>
          <StateChart items={result.items} />
        </motion.div>
      )}

      <motion.div variants={childVariants}>
        <MatchesTable
          matches={result.matches}
          unresolved={result.unresolved}
        />
      </motion.div>

      {result.items.length > 0 && (
        <motion.div variants={childVariants}>
          <ItemPriceList items={result.items} />
        </motion.div>
      )}
    </motion.section>
  )
}
