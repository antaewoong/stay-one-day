import { withAdminAuth } from '@/middleware/withAdminAuth'

export const runtime = 'nodejs'

export const GET = withAdminAuth(async () => {
  return Response.json({ 
    ok: true, 
    message: 'Admin authentication successful',
    timestamp: new Date().toISOString()
  })
})