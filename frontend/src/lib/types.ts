// TypeScript interfaces mirroring backend/src/models.py exactly

export interface ItemMatch {
  query: string
  item_code: number | null
  item_name: string | null
  confidence: number // 0.0–1.0
  resolved: boolean
  match_type: 'llm' | 'fuzzy'
}

export interface PremisePrice {
  premise_code: number
  premise: string
  state: string
  price: number
  address?: string | null
  distance_km?: number | null
  distance_source?: 'driving' | 'straight_line' | null
  latitude?: number | null
  longitude?: number | null
}

export interface BasketItemResult {
  item_code: number
  item_name: string
  cheapest: PremisePrice | null
  store_price: number | null
}

export interface StateRanking {
  state: string
  total: number
  items_found: number
}

export interface StoreRanking {
  premise_code: number
  premise: string
  state?: string | null
  total: number
  items_found: number
  address?: string | null
  distance_km?: number | null
  distance_source?: 'driving' | 'straight_line' | null
  latitude?: number | null
  longitude?: number | null
}

export interface BasketResult {
  matches: ItemMatch[]
  items: BasketItemResult[]
  state_ranking: StateRanking[]
  store_ranking: StoreRanking[]
  total: number
  savings: number
  national_average: number
  is_single_store: boolean
  unresolved: string[]
  is_fuzzy_fallback: boolean
  error?: string | null
  radius_km_used?: number | null
  no_stores_in_radius?: boolean
}


export interface BasketRequest {
  items: string[]
  state?: string
  provider?: 'gemini'
  model?: string
  api_key?: string
  lat?: number
  lng?: number
  radius_km?: number
}

export interface ApiError {
  message: string
  status?: number
}
