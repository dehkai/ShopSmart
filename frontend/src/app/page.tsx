'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useBasket } from '@/hooks/useBasket'
import { BasketInput } from '@/components/basket/BasketInput'
import { StateSelector } from '@/components/basket/StateSelector'
import { ResultsSection } from '@/components/results/ResultsSection'
import { APIKeyModal } from '@/components/basket/APIKeyModal'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Home() {
  const {
    basketText,
    setBasketText,
    selectedState,
    setSelectedState,
    result,
    submittedCount,
    loading,
    error,
    handleSubmit,
    reset,

    // API Modal parameters
    provider,
    model,
    apiKey,
    isModalOpen,
    setIsModalOpen,
    handleSaveAPIKey,
  } = useBasket()

  // 3D Parallax hover state for the floating card
  const [tilt, setTilt] = useState({ x: -2, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window === 'undefined' || window.innerWidth <= 1024) return
    const x = (window.innerWidth / 2 - e.clientX) / 45
    const y = (window.innerHeight / 2 - e.clientY) / 45
    setTilt({ x, y })
  }

  const handleMouseLeave = () => {
    setTilt({ x: -2, y: 0 })
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-[#0e1322] text-[#dee1f7] overflow-x-hidden selection:bg-[#22c55e]/30">

      <div className="fixed inset-0 grain-overlay z-0 pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[600px] h-[600px] bg-[#22c55e]/10 rounded-full blur-[120px] z-0 pointer-events-none" />

      <header className="absolute top-6 left-6 right-6 md:left-16 md:right-16 z-50 flex items-center justify-between select-none">
        <div
          onClick={() => result && reset()}
          className="font-sans text-2xl font-extrabold text-[#22c55e] tracking-tighter cursor-pointer"
        >
          ShopSmart
        </div>

        {/* API Connection settings indicator */}
        <button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/15 transition-all text-xs font-semibold text-[#dee1f7] cursor-pointer"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-[#22c55e] animate-pulse' : 'bg-red-400'}`} />
          <span className="hidden sm:inline text-[#bccbb9]/60">API Key:</span>
          <span>{apiKey ? `${provider === 'gemini' ? 'Gemini' : 'Groq'} (${model})` : 'Setup Needed'}</span>
        </button>
      </header>

      <div className="relative z-10 flex flex-col flex-1">

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.main
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, transition: { duration: 0.25 } }}
              transition={{ duration: 0.45, ease: EASE }}
              className="relative z-10 pt-20 pb-20 lg:pt-32 px-6 md:px-16 max-w-7xl mx-auto min-h-screen lg:h-screen flex items-center w-full lg:overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">

                <div className="lg:col-span-7 space-y-6">
                  <header className="space-y-3">
                    <h1
                      className="font-extrabold tracking-tight text-[#dee1f7]"
                      style={{
                        fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                        lineHeight: 1.1,
                      }}
                    >
                      Find the cheapest groceries{' '}
                      <span className="block bg-gradient-to-r from-[#22c55e] to-[#60a5fa] bg-clip-text text-transparent">
                        anywhere in Malaysia
                      </span>
                    </h1>
                    <p className="text-[#bccbb9] text-sm leading-relaxed max-w-xl">
                      Paste your shopping list. Our AI matches every item to real PriceCatcher data and finds where your basket costs least.
                    </p>
                  </header>

                  <div className="glass-card rounded-[2rem] p-6 md:p-8 space-y-6 shadow-2xl shadow-black/20">
                    <StateSelector
                      value={selectedState}
                      onChange={setSelectedState}
                    />
                    <BasketInput
                      value={basketText}
                      onChange={setBasketText}
                      onSubmit={handleSubmit}
                      loading={loading}
                      error={error}
                    />
                  </div>
                </div>

                <div
                  className="lg:col-span-5 relative hidden lg:flex flex-col items-center"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="relative group perspective-[1000px]">

                    {/* Glowing backdrops */}
                    <div className="absolute inset-0 bg-[#22c55e]/20 blur-3xl group-hover:bg-[#22c55e]/30 transition-all duration-500 rounded-full" />

                    {/* Floating Preview Card Container */}
                    <div
                      className="glass-card w-[380px] rounded-3xl p-6 border-[#22c55e]/20 shadow-2xl relative z-10 transition-all duration-500 ease-out"
                      style={{
                        transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#bccbb9]">Live Comparison</span>
                        <span className="text-[#22c55e] text-[12px] font-bold bg-[#22c55e]/10 px-2.5 py-0.5 rounded">-14% Avg</span>
                      </div>

                      <div className="space-y-4">

                        {/* Sample item 1 */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-[#dee1f7] font-semibold text-xs leading-normal">Holland Onions</div>
                            <div className="text-[#bccbb9]/60 text-[10px] mt-0.5 truncate">Mydin Chow Kit · Selangor</div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 ml-4">
                            <div className="text-[#22c55e] font-mono text-xs font-semibold">RM 4.50</div>
                            <span className="bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25 px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 select-none pointer-events-none">
                              - RM 0.80
                            </span>
                          </div>
                        </div>

                        {/* Sample item 2 */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-[#dee1f7] font-semibold text-xs leading-normal">Dutch Lady Milk</div>
                            <div className="text-[#bccbb9]/60 text-[10px] mt-0.5 truncate">Lotus's Cheras · KL</div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 ml-4">
                            <div className="text-[#22c55e] font-mono text-xs font-semibold">RM 7.20</div>
                            <span className="bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25 px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 select-none pointer-events-none">
                              - RM 1.10
                            </span>
                          </div>
                        </div>

                        {/* Sample item 3 */}
                        <div className="flex items-center justify-between pb-1">
                          <div className="min-w-0 flex-1">
                            <div className="text-[#dee1f7] font-semibold text-xs leading-normal">Sawi Choy Sum</div>
                            <div className="text-[#bccbb9]/60 text-[10px] mt-0.5 truncate">Giant Supermarket · Johor</div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 ml-4">
                            <div className="text-[#22c55e] font-mono text-xs font-semibold">RM 2.80</div>
                            <span className="bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25 px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 select-none pointer-events-none">
                              - RM 0.50
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-[#bccbb9]/40 text-xs italic tracking-wide">Example output</div>

                  {/* Trust statistics row */}
                  <div className="mt-6 flex gap-4 select-none">
                    <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#dee1f7]">2M+ prices/month</span>
                    </div>
                    <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#dee1f7]">16 states</span>
                    </div>
                    <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#dee1f7]">1000+ items</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.main>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full flex-1 flex flex-col"
            >
              <div className="pt-20 pb-16 px-6 md:px-16 w-full max-w-7xl mx-auto">

                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error-banner"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="glass mb-6 px-4 py-3 rounded-lg flex items-start gap-3 text-sm text-[#ffb4ab]"
                      style={{ borderColor: 'rgba(255,180,171,0.3)' }}
                      role="alert"
                    >
                      <span aria-hidden>⚠</span>
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <ResultsSection result={result} onReset={reset} selectedState={selectedState} submittedCount={submittedCount} />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Connection setup modal popup (design.md aligned) */}
      <APIKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAPIKey}
        initialProvider={provider}
        initialModel={model}
        initialApiKey={apiKey}
      />
    </div>
  )
}
