import { GlassCard } from './GlassCard'

const accentColors = {
  green: 'text-primary',
  blue: 'text-secondary',
  white: 'text-fg',
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
        className="text-xs font-semibold uppercase tracking-widest text-muted"
        style={{ letterSpacing: '0.1em' }}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-bold leading-tight ${accentColors[accent]} ${mono ? 'mono' : ''}`}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-xs mt-0.5 text-subtle">
          {subtext}
        </p>
      )}
    </GlassCard>
  )
}
