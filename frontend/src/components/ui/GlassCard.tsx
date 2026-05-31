import type { ReactNode } from 'react'

const paddingMap = {
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
} as const

interface GlassCardProps {
  children: ReactNode
  className?: string
  padding?: keyof typeof paddingMap
  hover?: boolean
}

export function GlassCard({
  children,
  className = '',
  padding = 'md',
  hover = false,
}: GlassCardProps) {
  return (
    <div
      className={`glass ${hover ? 'glass-hover' : ''} ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  )
}
