import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''

  try {
    const res = await fetch(
      `${BACKEND_URL}/items?q=${encodeURIComponent(q)}`,
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { detail: 'Backend unavailable — is the FastAPI server running?' },
      { status: 503 },
    )
  }
}
