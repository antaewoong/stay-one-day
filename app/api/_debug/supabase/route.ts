import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT_SET'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'NOT_SET'
  
  // Extract project ref from URL
  const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'NOT_FOUND'
  
  return NextResponse.json({
    projectRef,
    url: url.slice(0, 50) + '...',
    anonKeyHash: anonKey.slice(0, 20) + '...',
    serviceKeyHash: serviceKey.slice(0, 20) + '...',
    expectedRef: 'fcmauibvdqbocwhloqov'
  })
}