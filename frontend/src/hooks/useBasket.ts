'use client'

import { useState, useCallback, useEffect } from 'react'
import { submitBasket } from '@/lib/api'
import type { BasketResult, ApiError, ItemMatch, BasketItemResult } from '@/lib/types'

const USE_MOCK = false

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
    const isUnresolved = q.toLowerCase().includes('honey') || (idx > 0 && idx % 4 === 0)

    if (isUnresolved) {
      matches.push({
        query: q,
        item_code: null,
        item_name: null,
        confidence: 0.0,
        match_type: 'llm',
        resolved: false
      })
      unresolved.push(q)
    } else {
      const code = 100000 + idx
      const cleanName = q.replace(/^\d+(kg|g|l|s|pcs|pack|biji)?\s+/i, '')
      const mockName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

      const basePrice = 4.20 + (idx * 3.10) + (q.length % 4)
      const store = MOCK_STORES[idx % MOCK_STORES.length]

      matches.push({
        query: q,
        item_code: code,
        item_name: mockName,
        confidence: 0.82 + (idx % 3) * 0.08,
        match_type: 'llm',
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
        },
        store_price: basePrice
      })
      total += basePrice
    }
  })

  return {
    matches,
    items,
    total,
    savings: total * 0.26,
    unresolved,
    state_ranking: [],
    store_ranking: [],
    is_single_store: true,
    is_fuzzy_fallback: false,
    national_average: total,
    error: null,
  }
}


export function useBasket() {
  const [basketText, setBasketText] = useState<string>('')
  const [selectedState, setSelectedState] = useState<string>('')
  const [result, setResult] = useState<BasketResult | null>(null)
  const [submittedCount, setSubmittedCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<'gemini'>('gemini')
  const [model, setModel] = useState<string>('gemini-2.5-flash')
  const [apiKey, setApiKey] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProvider = localStorage.getItem('shopsmart_selected_provider') as 'gemini' | null
      const savedModel = localStorage.getItem('shopsmart_selected_model')

      if (savedProvider) {
        setProvider(savedProvider)
        const savedKey = localStorage.getItem(`shopsmart_${savedProvider}_api_key`) || ''
        setApiKey(savedKey)
      }
      if (savedModel) {
        setModel(savedModel)
      }
    }
  }, [])

  const handleChange = useCallback((val: string) => {
    setBasketText(val)
    if (error) setError(null)
  }, [error])

  const runSubmit = useCallback(async (
    overrideProvider?: 'gemini',
    overrideModel?: string,
    overrideApiKey?: string
  ) => {
    const items = basketText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (items.length === 0) {
      setError('Please enter at least one item.')
      return
    }

    const currentProvider = overrideProvider || provider
    const currentModel = overrideModel || model
    const currentApiKey = overrideApiKey || apiKey

    // If API key is missing, intercept and trigger modal setup!
    if (!currentApiKey.trim()) {
      setIsModalOpen(true)
      return
    }

    setLoading(true)
    setError(null)
    setSubmittedCount(items.length)

    if (USE_MOCK) {
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
        provider: currentProvider,
        model: currentModel,
        api_key: currentApiKey,
      })
      setResult(data)
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [basketText, selectedState, provider, model, apiKey])

  const handleSubmit = useCallback(async () => {
    await runSubmit()
  }, [runSubmit])

  const handleSaveAPIKey = useCallback((prov: 'gemini', mod: string, key: string) => {
    setProvider(prov)
    setModel(mod)
    setApiKey(key)
    setIsModalOpen(false)

    if (typeof window !== 'undefined') {
      localStorage.setItem('shopsmart_selected_provider', prov)
      localStorage.setItem('shopsmart_selected_model', mod)
      if (key) {
        localStorage.setItem(`shopsmart_${prov}_api_key`, key)
      } else {
        localStorage.removeItem(`shopsmart_${prov}_api_key`)
      }
    }

    if (key) {
      runSubmit(prov, mod, key)
    }
  }, [runSubmit])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    basketText,
    setBasketText: handleChange,
    selectedState,
    setSelectedState,
    result,
    submittedCount,
    loading,
    error,
    handleSubmit,
    reset,

    provider,
    model,
    apiKey,
    isModalOpen,
    setIsModalOpen,
    handleSaveAPIKey,
  }
}

