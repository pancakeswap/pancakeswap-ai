import { checkRateLimit } from '@vercel/firewall'

export const config = {
  matcher: '/api/ping',
}

const PING_RATE_LIMIT_ID = process.env.PING_RATE_LIMIT_ID ?? 'api-ping'
// Configure a matching @vercel/firewall rate limit rule in the Vercel dashboard.

export default async function middleware(req: Request): Promise<Response | undefined> {
  try {
    const { rateLimited } = await checkRateLimit(PING_RATE_LIMIT_ID, { request: req })
    if (!rateLimited) {
      return undefined
    }

    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '1',
      },
    })
  } catch (err) {
    console.error('[ping] firewall rate limit check failed', err)
    return undefined
  }
}
