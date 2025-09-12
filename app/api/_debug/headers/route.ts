export const runtime = 'nodejs'

export async function GET(req: Request) {
  const auth = new Headers(req.headers).get('authorization') ?? null
  return new Response(JSON.stringify({ 
    hasAuth: !!auth, 
    authPrefix: auth?.split(' ')[0] ?? null,
    timestamp: new Date().toISOString()
  }), {
    status: 200, 
    headers: { 'content-type': 'application/json' }
  })
}