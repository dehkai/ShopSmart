import { GlassCard } from './GlassCard'

const accentColors = {
  green: 'text-[#22c55e]',
  blue: 'text-[#60a5fa]',
  white: 'text-[#e2e2e6]',
} as const

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  accent?: keyof typeof accentColors
  mono?: boolean
}

export function StatCard({
  label,
  value,
  subtext,
  accent = 'white',
  mono = false,
}: StatCardProps) {
  return (
    <GlassCard padding="md" hover className="flex flex-col gap-1">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#c4c6d0', letterSpacing: '0.1em' }}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-bold leading-tight ${accentColors[accent]} ${mono ? 'mono' : ''}`}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-xs mt-0.5" style={{ color: '#8e9099' }}>
          {subtext}
        </p>
      )}
    </GlassCard>
  )
}
