import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  size = 'md',
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-[transform,box-shadow,background-color] duration-200 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

  const variantClass =
    variant === 'primary'
      ? 'bg-gradient-to-r from-primary to-primary-dim text-on-primary hover:from-primary-dim hover:to-primary-dim/90 active:from-primary-dim/90 active:to-primary-dim/70 shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_28px_rgba(34,197,94,0.35)] btn-shimmer'
      : 'border border-border text-muted hover:bg-overlay-sm hover:border-border/60'

  return (
    <button
      className={`${base} ${variantClass} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
