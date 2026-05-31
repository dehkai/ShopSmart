'use client'

import { motion } from 'framer-motion'

interface IconCardProps {
  icon: React.ReactNode
  name: string
  spec: string
  priceRange: string
  savingsPct: string
}

export function IconCard({ icon, name, spec, priceRange, savingsPct }: IconCardProps) {
  return (
    <motion.div
      className="glass glass-hover p-5 flex flex-col items-center gap-3 text-center relative"
      style={{ borderRadius: '14px' }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      {/* Savings badge */}
      <span
        className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full mono"
        style={{
          background: 'rgba(34,197,94,0.12)',
          color: '#22c55e',
          border: '1px solid rgba(34,197,94,0.25)',
        }}
      >
        {savingsPct}
      </span>

      {/* Icon container */}
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'rgba(34,197,94,0.10)',
          border: '1px solid rgba(34,197,94,0.20)',
          color: '#22c55e',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <p className="font-semibold text-sm" style={{ color: '#e2e2e6' }}>{name}</p>
        <p className="text-xs mt-0.5" style={{ color: '#8e9099' }}>{spec}</p>
      </div>

      <span className="mono text-sm font-semibold" style={{ color: '#22c55e' }}>
        {priceRange}
      </span>
      <span className="text-xs" style={{ color: '#44474e' }}>price range across states</span>
    </motion.div>
  )
}
