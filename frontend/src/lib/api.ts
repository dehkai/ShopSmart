import type { BasketRequest, BasketResult, ItemMatch, ApiError } from './types'
import { BACKEND_TIMEOUT_MS } from './constants'

async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

function buildApiError(message: string, status?: number): ApiError {
  return { message, status }
}

export async function submitBasket(req: BasketRequest): Promise<BasketResult> {
  let res: Response
  try {
    res = await fetchWithTimeout('/api/basket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw buildApiError('Request timed out — the matcher is taking too long.', 408)
    }
    throw buildApiError('Network error — is the app running?')
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (typeof body?.detail === 'string') detail = body.detail
    } catch {
      // ignore parse failure
    }
    throw buildApiError(detail, res.status)
  }

  return res.json() as Promise<BasketResult>
}

export async function searchItems(q: string): Promise<ItemMatch[]> {
  let res: Response
  try {
    res = await fetchWithTimeout(`/api/items?q=${encodeURIComponent(q)}`)
  } catch {
    throw buildApiError('Network error searching items.')
  }

  if (!res.ok) {
    throw buildApiError(`Search failed (${res.status})`, res.status)
  }

  return res.json() as Promise<ItemMatch[]>
}
