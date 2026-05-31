'use client'

import { useState, useCallback } from 'react'
import { submitBasket } from '@/lib/api'
import type { BasketResult, ApiError } from '@/lib/types'

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
