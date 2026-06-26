import { CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_MID } from '@/lib/constants'

type BadgeVariant = 'resolved' | 'unresolved' | 'confidence'

interface BadgeProps {
  variant: BadgeVariant
  value?: number // for confidence: 0–1
  label?: string // override text
}

function confidenceStyle(v: number): { className: string; label: string } {
  if (v >= CONFIDENCE_THRESHOLD_HIGH) {
    return {
      className: 'bg-primary/10 text-primary border border-primary/30',
      label: 'High',
    }
  }
  if (v >= CONFIDENCE_THRESHOLD_MID) {
    return {
      className: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30',
      label: 'Mid',
    }
  }
  return {
    className: 'bg-error/10 text-error border border-error/30',
    label: 'None',
  }
}

export function Badge({ variant, value, label }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold'

  if (variant === 'resolved') {
    return (
      <span className={`${base} bg-primary/10 text-primary border border-primary/30`}>
        {label ?? 'Matched'}
      </span>
    )
  }

  if (variant === 'unresolved') {
    return (
      <span className={`${base} bg-error/10 text-error border border-error/30`}>
        {label ?? 'Not Found'}
      </span>
    )
  }

  // confidence
  const conf = value ?? 0
  const { className, label: confLabel } = confidenceStyle(conf)
  return (
    <span className={`${base} mono ${className}`}>{label ?? confLabel}</span>
  )
}
