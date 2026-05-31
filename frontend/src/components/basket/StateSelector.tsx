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
        className="text-sm font-semibold"
        style={{ color: '#c4c6d0' }}
      >
        Filter by state
        <span className="ml-1 font-normal" style={{ color: '#8e9099' }}>
          (optional)
        </span>
      </label>

      <select
        id="state-selector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass rounded-lg px-4 py-2.5 text-sm appearance-none cursor-pointer
          focus:outline-none focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/20
          transition-all duration-200"
        style={{ color: '#e2e2e6' }}
        aria-label="Filter results by Malaysian state"
      >
        <option value="" style={{ background: '#1c2132' }}>
          All states
        </option>
        {MALAYSIAN_STATES.map((state) => (
          <option key={state} value={state} style={{ background: '#1c2132' }}>
            {state}
          </option>
        ))}
      </select>
    </div>
  )
}
