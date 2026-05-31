'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Activity, User, Egg, Wheat, Droplets } from 'lucide-react'
import { useBasket } from '@/hooks/useBasket'
import { BasketInput } from '@/components/basket/BasketInput'
import { StateSelector } from '@/components/basket/StateSelector'
import { ResultsSection } from '@/components/results/ResultsSection'
import { IconCard } from '@/components/ui/IconCard'

// ── Static showcase items ─────────────────────────────────────────────────────
const SHOWCASE = [
  {
    icon: <Egg size={22} strokeWidth={1.5} />,
    name: 'Telur Gred A',
    spec: '10 biji',
    priceRange: 'RM 4.20 – 6.80',
    savingsPct: '−38%',
  },
  {
    icon: <Wheat size={22} strokeWidth={1.5} />,
    name: 'Beras Tempatan',
    spec: '5kg',
    priceRange: 'RM 13.90 – 18.50',
    savingsPct: '−25%',
  },
  {
    icon: <Droplets size={22} strokeWidth={1.5} />,
    name: 'Minyak Masak',
    spec: '1 liter',
    priceRange: 'RM 6.40 – 9.90',
    savingsPct: '−35%',
  },
]

const TRUST_STATS = [
  { value: '2M+', label: 'prices / month' },
  { value: '16', label: 'states' },
  { value: '1,000+', label: 'items tracked' },
]

const EASE = [0.16, 1, 0.3, 1] as const

export default function Home() {
  const {
    basketText,
    setBasketText,
    selectedState,
    setSelectedState,
    result,
    loading,
    error,
    handleSubmit,
    reset,
  } = useBasket()

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Ambient glows ─────────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1000px',
          height: '560px',
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          bottom: '-15%',
          right: '-8%',
          width: '600px',
          height: '420px',
          background: 'radial-gradient(ellipse, rgba(96,165,250,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">

        {/* ── Nav ───────────────────────────────────────────────────────────── */}
        <nav
          className="w-full px-6 py-3.5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Logo */}
          <span className="text-lg font-bold tracking-tight" style={{ color: '#22c55e' }}>
            ShopSmart
          </span>

          {/* Centre: live chip + nav links */}
          <div className="hidden md:flex items-center gap-5">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.15)',
                color: '#22c55e',
              }}
            >
              <div className="pulse-dot" />
              <Activity size={11} strokeWidth={2} />
              <span>Live prices</span>
            </div>

            <div className="flex items-center gap-5 text-sm" style={{ color: '#8e9099' }}>
              <span
                className="cursor-default transition-colors"
                style={{ color: '#e2e2e6' }}
              >
                Optimizer
              </span>
              <span className="hover:text-[#c4c6d0] transition-colors cursor-pointer">
                Price Map
              </span>
              <span className="hover:text-[#c4c6d0] transition-colors cursor-pointer">
                History
              </span>
            </div>
          </div>

          {/* Right: user icon + badge */}
          <div className="flex items-center gap-2.5">
            <button
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              style={{ color: '#8e9099' }}
              aria-label="Account"
            >
              <User size={18} strokeWidth={1.5} />
            </button>
            <span
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{
                background: 'rgba(34,197,94,0.12)',
                color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.2)',
              }}
            >
              Malaysia
            </span>
          </div>
        </nav>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16">

          {/* ── Hero — hidden once results arrive ─────────────────────────── */}
          <AnimatePresence>
            {!result && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {/* ── Split layout ──────────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 pt-12 pb-8 items-start">

                  {/* Left: headline + meta */}
                  <div className="flex flex-col gap-6 lg:pt-4">
                    <div>
                      <h1
                        className="font-extrabold leading-tight"
                        style={{
                          fontSize: 'clamp(2rem, 4.5vw, 3.1rem)',
                          letterSpacing: '-0.03em',
                          color: '#e2e2e6',
                          lineHeight: 1.12,
                        }}
                      >
                        Find the cheapest groceries{' '}
                        <span style={{ color: '#22c55e' }}>
                          anywhere in Malaysia.
                        </span>
                      </h1>
                      <p
                        className="text-base mt-4 leading-relaxed"
                        style={{ color: '#8e9099', maxWidth: '38ch' }}
                      >
                        Paste your shopping list. AI matches items to PriceCatcher
                        data and finds the cheapest store — per item and
                        basket-wide.
                      </p>
                    </div>

                    {/* −14% avg chip */}
                    <div
                      className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-sm"
                      style={{
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.18)',
                      }}
                    >
                      <span className="mono font-bold" style={{ color: '#22c55e' }}>
                        −14%
                      </span>
                      <span style={{ color: '#8e9099' }}>
                        avg. savings vs most expensive store
                      </span>
                    </div>

                    {/* Trust stats */}
                    <div className="flex items-start gap-7 flex-wrap">
                      {TRUST_STATS.map((s) => (
                        <div key={s.label} className="flex flex-col gap-0.5">
                          <span
                            className="mono text-xl font-bold"
                            style={{ color: '#22c55e' }}
                          >
                            {s.value}
                          </span>
                          <span className="text-xs" style={{ color: '#8e9099' }}>
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: input card */}
                  <div
                    className="glass flex flex-col gap-4 p-5"
                    style={{ borderRadius: '16px' }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: '#8e9099', letterSpacing: '0.1em' }}
                    >
                      Your shopping list
                    </p>
                    <StateSelector
                      value={selectedState}
                      onChange={setSelectedState}
                    />
                    <BasketInput
                      value={basketText}
                      onChange={setBasketText}
                      onSubmit={handleSubmit}
                      loading={loading}
                    />
                  </div>
                </div>

                {/* ── Showcase icon cards ───────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {SHOWCASE.map((item) => (
                    <IconCard key={item.name} {...item} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Error banner ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="glass mb-6 px-4 py-3 rounded-lg flex items-start gap-3 text-sm"
                style={{
                  borderColor: 'rgba(255,180,171,0.3)',
                  color: '#ffb4ab',
                }}
                role="alert"
              >
                <span aria-hidden>⚠</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results ───────────────────────────────────────────────────── */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <ResultsSection result={result} onReset={reset} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer
          className="text-center text-xs py-6 px-4"
          style={{
            color: '#44474e',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          Data:{' '}
          <a
            href="https://data.gov.my/data-catalogue/pricecatcher"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-colors"
            style={{ color: '#8e9099' }}
          >
            PriceCatcher · data.gov.my
          </a>{' '}
          · CC-BY 4.0
        </footer>
      </div>
    </div>
  )
}
