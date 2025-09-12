import { NextResponse } from 'next/server'
import { getCostsWindow } from '@/src/lib/ai/cost-logger'

export async function GET() {
  const data = getCostsWindow(30)
  return NextResponse.json(data)
}

