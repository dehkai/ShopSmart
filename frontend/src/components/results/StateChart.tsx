'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { BasketItemResult } from '@/lib/types'
import { GlassCard } from '@/components/ui/GlassCard'

interface StateChartProps {
  items: BasketItemResult[]
}

interface ChartDatum {
  state: string
  count: number
}

function deriveStateData(items: BasketItemResult[]): ChartDatum[] {
  const counts: Record<string, number> = {}
  for (const item of items) {
    if (item.cheapest) {
      const s = item.cheapest.state
      counts[s] = (counts[s] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'rgba(22, 27, 43, 0.95)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '8px',
        padding: '8px 12px',
      }}
    >
      <p style={{ color: '#c4c6d0', fontSize: 12, marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#22c55e', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
        {payload[0].value} item{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function StateChart({ items }: StateChartProps) {
  const data = deriveStateData(items)

  if (data.length === 0) return null

  return (
    <GlassCard padding="md">
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: '#c4c6d0', letterSpacing: '0.1em' }}
      >
        Cheapest items by state
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="#44474e" strokeDasharray="3 3" />
          <XAxis
            dataKey="state"
            tick={{ fill: '#c4c6d0', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#8e9099', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
