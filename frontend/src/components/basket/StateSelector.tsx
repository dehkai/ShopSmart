'use client'

import { MALAYSIAN_STATES } from '@/lib/constants'

interface StateSelectorProps {
  value: string
  onChange: (state: string) => void
}

export function StateSelector({ value, onChange }: StateSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="state-selector"
        className="text-[10px] font-bold uppercase tracking-wider text-muted/60"
        style={{ letterSpacing: '0.1em' }}
      >
        Select Region
      </label>

      <div className="relative w-full">
        <select
          id="state-selector"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-overlay-sm border border-border hover:bg-overlay-md hover:border-border/60 focus:border-primary/45 focus:bg-surface-dim text-fg text-xs font-semibold rounded-xl px-4 py-3 outline-none cursor-pointer appearance-none transition-[background-color,border-color] duration-200 shadow-md"
        >
          <option value="" className="bg-surface text-fg font-semibold">
            All States (National Average)
          </option>
          {MALAYSIAN_STATES.map((state) => (
            <option key={state} value={state} className="bg-surface text-fg">
              {state}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none select-none">
          <svg
            className="w-4 h-4 text-subtle opacity-70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

