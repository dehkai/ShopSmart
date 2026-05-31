import type { BasketResult } from '@/lib/types'

export function exportBasketCsv(result: BasketResult): void {
  const rows: string[][] = [
    ['Item', 'Cheapest Store', 'State', 'Best Price (RM)'],
    ...result.items
      .filter((i) => i.cheapest !== null)
      .map((i) => [
        i.item_name,
        i.cheapest!.premise,
        i.cheapest!.state,
        i.cheapest!.price.toFixed(2),
      ]),
  ]

  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'shopsmart-results.csv'
  a.click()
  URL.revokeObjectURL(url)
}
