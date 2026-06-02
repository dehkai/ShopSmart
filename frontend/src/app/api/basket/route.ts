import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8001'

interface BasketRequestBody {
  items?: string[]
  state?: string
  provider?: string
  model?: string
  api_key?: string
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: BasketRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 })
  }

  const backendPayload = {
    grocery_list: (body.items ?? []).join(', '),
    provider: body.provider,
    model: body.model,
    api_key: body.api_key,
  }

  try {
    const res = await fetch(`${BACKEND_URL}/basket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable — is the FastAPI server running?' },
      { status: 503 },
    )
  }
}
