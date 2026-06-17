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
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-[transform,box-shadow,background-color] duration-200 active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

  const variantClass =
    variant === 'primary'
      ? 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-[#003915] hover:from-[#16a34a] hover:to-[#15803d] active:from-[#15803d] active:to-[#14532d] shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_28px_rgba(34,197,94,0.35)] btn-shimmer'
      : 'border border-white/10 text-[#c4c6d0] hover:bg-white/5 hover:border-white/20'

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
