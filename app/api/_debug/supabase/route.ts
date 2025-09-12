export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function projectRefFromUrl(u?: string | null) {
  try { return new URL(u!).host.split('.')[0] } catch { return null }
}
function decodeRefFromJwt(jwt?: string | null) {
  try {
    if (!jwt) return null
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString())
    return payload?.ref ?? null
  } catch { return null }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null
  const envRef = projectRefFromUrl(url)
  const anonRef = decodeRefFromJwt(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null)
  const svcRef = decodeRefFromJwt(process.env.SUPABASE_SERVICE_ROLE_KEY || null)
  return Response.json({
    url,
    refs: { envRef, anonRef, svcRef },
    sameProject: !!(envRef && envRef === anonRef && envRef === svcRef)
  })
}