interface SpinnerProps {
  size?: 'sm' | 'md'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <span
      className={`${sizeClass} animate-spin inline-block rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-label="Loading"
    />
  )
}
