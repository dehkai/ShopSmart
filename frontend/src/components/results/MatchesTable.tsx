import type { ItemMatch } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { GlassCard } from '@/components/ui/GlassCard'

interface MatchesTableProps {
  matches: ItemMatch[]
  unresolved: string[]
}

export function MatchesTable({ matches, unresolved }: MatchesTableProps) {
  return (
    <GlassCard padding="sm" className="overflow-hidden">
      <p
        className="text-xs font-semibold uppercase tracking-widest px-3 pt-3 pb-2"
        style={{ color: '#c4c6d0', letterSpacing: '0.1em' }}
      >
        Item matching
      </p>

      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Your input', 'Matched item', 'Confidence', 'Status'].map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-2 text-xs font-semibold uppercase"
                  style={{ color: '#8e9099', letterSpacing: '0.05em' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((match, i) => (
              <tr
                key={i}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                className="transition-colors hover:bg-white/[0.03]"
              >
                <td
                  className="px-3 py-2.5 mono max-w-[160px] truncate"
                  title={match.query}
                  style={{ color: '#c4c6d0' }}
                >
                  {match.query}
                </td>
                <td
                  className="px-3 py-2.5 max-w-[200px] truncate"
                  title={match.item_name ?? '—'}
                  style={{ color: '#e2e2e6' }}
                >
                  {match.item_name ?? <span style={{ color: '#8e9099' }}>—</span>}
                </td>
                <td className="px-3 py-2.5">
                  {match.resolved ? (
                    <Badge variant="confidence" value={match.confidence} />
                  ) : (
                    <span style={{ color: '#8e9099' }}>—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={match.resolved ? 'resolved' : 'unresolved'} />
                </td>
              </tr>
            ))}

            {unresolved.map((q, i) => (
              <tr
                key={`unresolved-${i}`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                className="transition-colors hover:bg-white/[0.03]"
              >
                <td
                  className="px-3 py-2.5 mono max-w-[160px] truncate"
                  title={q}
                  style={{ color: '#c4c6d0' }}
                >
                  {q}
                </td>
                <td className="px-3 py-2.5" style={{ color: '#8e9099' }}>
                  —
                </td>
                <td className="px-3 py-2.5" style={{ color: '#8e9099' }}>
                  —
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant="unresolved" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}
