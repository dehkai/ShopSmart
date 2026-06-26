'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BasketInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  loading: boolean
  error?: string | null
}

const PLACEHOLDER = `2kg Red Onions
1 pack Gardenia White Bread
3kg Thai Jasmine Rice
500g Chicken Breast`

export function BasketInput({
  value,
  onChange,
  onSubmit,
  loading,
  error,
}: BasketInputProps) {
  const [shortcutText, setShortcutText] = useState('Ctrl + Enter')

  useEffect(() => {
    const isMac = typeof window !== 'undefined' && 
      /Mac|iPod|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '')
    if (isMac) {
      setShortcutText('⌘ Enter')
    }
  }, [])

  const lineCount = value
    .split('\n')
    .filter((l) => l.trim().length > 0).length

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor="basket-input"
          className="text-[12px] font-semibold uppercase tracking-wider text-subtle"
          style={{ letterSpacing: '0.1em' }}
        >
          Your shopping list
        </label>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary" style={{ letterSpacing: '0.05em' }}>
          {lineCount > 0 ? `${lineCount} item${lineCount !== 1 ? 's' : ''}` : 'one item per line'}
        </span>
      </div>

      <textarea
        id="basket-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER}
        disabled={loading}
        rows={8}
        className="w-full h-48 lg:h-[clamp(6rem,16vh,18rem)] bg-surface-dim/50 border border-border rounded-xl p-4 lg:p-4 font-mono text-primary focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-subtle/30 resize-none text-sm leading-relaxed"
        spellCheck={false}
        aria-label="Enter grocery items, one per line"
      />

      {error && (
        <p role="alert" className="text-xs text-error flex items-center gap-1.5">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={onSubmit}
        className="shimmer w-full bg-gradient-to-r from-primary to-primary/80 text-on-primary font-bold text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98]"
        aria-busy={loading}
      >
        {loading ? 'Optimizing Basket…' : (
          <>
            Optimize Basket
            <ArrowRight size={16} strokeWidth={2.5} />
          </>
        )}
      </Button>

      <p className="text-xs text-center text-subtle">
        {shortcutText} to submit · Malay or English accepted
      </p>
    </div>
  )
}

