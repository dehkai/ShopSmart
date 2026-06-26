import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8001'

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const itemCode = searchParams.get('item_code')
  const state = searchParams.get('state') ?? ''

  try {
    let url = `${BACKEND_URL}/items`
    if (itemCode) {
      url = `${BACKEND_URL}/items/${itemCode}/prices?state=${encodeURIComponent(state)}`
    } else {
      url = `${BACKEND_URL}/items?q=${encodeURIComponent(q ?? '')}`
    }

    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable — is the FastAPI server running?' },
      { status: 503 },
    )
  }
}
