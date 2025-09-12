import { withAdminAuth } from '@/middleware/withAdminAuth'

export const runtime = 'nodejs'

export const GET = withAdminAuth(async () => Response.json({ ok: true }))