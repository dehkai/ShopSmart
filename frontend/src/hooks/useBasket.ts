'use client'

import { useState, useCallback } from 'react'
import { submitBasket } from '@/lib/api'
import type { BasketResult, ApiError, ItemMatch, BasketItemResult } from '@/lib/types'

// ── OPTION A: Mock Response Toggle ──────────────────────────────────────────
// Set this to true to run in local mock sandbox mode for instant UI reviews.
// Set to false to connect to the actual FastAPI backend.
const USE_MOCK = true

const MOCK_STORES = [
  { premise: "Mydin Chow Kit", state: "W.P. Kuala Lumpur" },
  { premise: "Lotus's Ara Damansara", state: "Selangor" },
  { premise: "Giant Hypermarket", state: "Johor" },
  { premise: "AEON Queensbay", state: "Pulau Pinang" },
  { premise: "Pasar Borong Selayang", state: "Selangor" }
]

function generateMockResult(queries: string[], selectedState: string): BasketResult {
  const matches: ItemMatch[] = []
  const items: BasketItemResult[] = []
  const unresolved: string[] = []
  let total = 0

  queries.forEach((q, idx) => {
    // Make items containing 'honey' or every 4th item unresolved to test dashboard warnings
    const isUnresolved = q.toLowerCase().includes('honey') || (idx > 0 && idx % 4 === 0)
    
    if (isUnresolved) {
      matches.push({
        query: q,
        item_code: null,
        item_name: null,
        confidence: 0.0,
        resolved: false
      })
      unresolved.push(q)
    } else {
      const code = 100000 + idx
      // Clean up inputs like "2kg Red Onions" -> "Red Onions"
      const cleanName = q.replace(/^\d+(kg|g|l|s|pcs|pack|biji)?\s+/i, '')
      const mockName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
      
      const basePrice = 4.20 + (idx * 3.10) + (q.length % 4)
      const store = MOCK_STORES[idx % MOCK_STORES.length]
      
      matches.push({
        query: q,
        item_code: code,
        item_name: mockName,
        confidence: 0.82 + (idx % 3) * 0.08,
        resolved: true
      })
      
      items.push({
        item_code: code,
        item_name: mockName,
        cheapest: {
          premise_code: 200 + idx,
          premise: store.premise,
          state: selectedState || store.state,
          price: basePrice
        }
      })
      total += basePrice
    }
  })

  return {
    matches,
    items,
    total,
    savings: total * 0.26,
    unresolved
  }
}

export function useBasket() {
  const [basketText, setBasketText] = useState<string>('')
  const [selectedState, setSelectedState] = useState<string>('')
  const [result, setResult] = useState<BasketResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    const items = basketText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (items.length === 0) {
      setError('Please enter at least one item.')
      return
    }

    setLoading(true)
    setError(null)

    // Option A: Quick Mock Sandbox Mode
    if (USE_MOCK) {
      // Simulate small dynamic api delay
      await new Promise((resolve) => setTimeout(resolve, 800))
      const data = generateMockResult(items, selectedState)
      setResult(data)
      setLoading(false)
      return
    }

    try {
      const data = await submitBasket({
        items,
        state: selectedState || undefined,
      })
      setResult(data)
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [basketText, selectedState])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    basketText,
    setBasketText,
    selectedState,
    setSelectedState,
    result,
    loading,
    error,
    handleSubmit,
    reset,
  }
}

