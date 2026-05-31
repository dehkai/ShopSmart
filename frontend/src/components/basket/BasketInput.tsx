'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BasketInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
  loading: boolean
}

const PLACEHOLDER = `telur gred A 10s
beras 5kg
minyak masak 1kg
susu segar 1L
roti gardenia
ayam beku 1kg`

export function BasketInput({
  value,
  onChange,
  onSubmit,
  loading,
}: BasketInputProps) {
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="basket-input"
          className="text-sm font-semibold"
          style={{ color: '#c4c6d0' }}
        >
          Grocery list
        </label>
        <span className="text-xs mono" style={{ color: '#8e9099' }}>
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
        rows={9}
        className="glass textarea-glow w-full resize-none rounded-lg p-4 text-sm leading-relaxed mono
          placeholder:text-[#44474e]
          disabled:opacity-60 transition-all duration-200"
        style={{ color: '#e2e2e6' }}
        spellCheck={false}
        aria-label="Enter grocery items, one per line"
      />

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={onSubmit}
        className="w-full"
        aria-busy={loading}
      >
        {loading ? 'Matching items…' : (
          <>
            Optimize Basket
            <ArrowRight size={16} strokeWidth={2.5} />
          </>
        )}
      </Button>

      <p className="text-xs text-center" style={{ color: '#8e9099' }}>
        ⌘ Enter to submit · Malay or English accepted
      </p>
    </div>
  )
}
