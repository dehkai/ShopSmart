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
        className="text-[10px] font-bold uppercase tracking-wider text-[#bccbb9]/60"
        style={{ letterSpacing: '0.1em' }}
      >
        Select Region
      </label>

      <div className="relative w-full">
        <select
          id="state-selector"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 focus:border-[#22c55e]/45 focus:bg-[#090e1c] text-[#dee1f7] text-xs font-semibold rounded-xl px-4 py-3 outline-none cursor-pointer appearance-none transition-[background-color,border-color] duration-200 shadow-md"
        >
          <option value="" className="bg-[#0e1322] text-[#dee1f7] font-semibold">
            All States (National Average)
          </option>
          {MALAYSIAN_STATES.map((state) => (
            <option key={state} value={state} className="bg-[#0e1322] text-[#dee1f7]">
              {state}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none select-none">
          <svg
            className="w-4 h-4 text-[#8e9099] opacity-70"
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

