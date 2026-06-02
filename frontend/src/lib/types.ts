// TypeScript interfaces mirroring backend/src/models.py exactly

export interface ItemMatch {
  query: string
  item_code: number | null
  item_name: string | null
  confidence: number // 0.0–1.0
  resolved: boolean
}

export interface PremisePrice {
  premise_code: number
  premise: string
  state: string
  price: number
}

export interface BasketItemResult {
  item_code: number
  item_name: string
  cheapest: PremisePrice | null
}

export interface StateRanking {
  state: string
  total: number
  items_found: number
}

export interface StoreRanking {
  premise_code: number
  premise: string
  total: number
  items_found: number
}

export interface BasketResult {
  matches: ItemMatch[]
  items: BasketItemResult[]
  state_ranking: StateRanking[]
  store_ranking: StoreRanking[]
  total: number
  savings: number
  is_single_store: boolean
  unresolved: string[]
}

export interface BasketRequest {
  items: string[]
  state?: string
  provider?: 'gemini' | 'groq'
  model?: string
  api_key?: string
}

export interface ApiError {
  message: string
  status?: number
}
