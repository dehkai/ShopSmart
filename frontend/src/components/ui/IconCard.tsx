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
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Savings badge */}
      <span
        className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full mono"
        style={{
          background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          color: 'var(--primary)',
          border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
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
          background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
          color: 'var(--primary)',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <p className="font-semibold text-sm text-fg">{name}</p>
        <p className="text-xs mt-0.5 text-subtle">{spec}</p>
      </div>

      <span className="mono text-sm font-semibold text-primary">
        {priceRange}
      </span>
      <span className="text-xs text-subtle/60">price range across states</span>
    </motion.div>
  )
}
