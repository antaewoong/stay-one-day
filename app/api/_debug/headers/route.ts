export const runtime = 'nodejs'

export async function GET(req: Request) {
  const h = new Headers(req.headers)
  const a = h.get('authorization')
  const x = h.get('x-supabase-auth')
  return new Response(JSON.stringify({
    hasAuth: !!a, 
    authPrefix: a?.split(' ')[0] ?? null,
    hasX: !!x,    
    xLen: x?.length ?? 0,
    timestamp: new Date().toISOString()
  }), { 
    status: 200, 
    headers: { 'content-type': 'application/json' } 
  })
}