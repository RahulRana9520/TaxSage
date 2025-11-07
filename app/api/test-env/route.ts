import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 10) || 'missing',
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('OPENROUTER') || key.includes('DATABASE') || key.includes('SUPABASE')
    )
  })
}
