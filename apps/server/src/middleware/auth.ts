import type { Context, Next } from 'hono'
import type { JWTPayload } from '../utils/jwt'
import { verifyJWT } from '../utils/jwt'

// Extend Hono context to include auth info
export type AuthContext = {
  Variables: {
    auth?: JWTPayload
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const secret = c.env.JWT_SECRET || 'xijingping-8964-tiananmen'

    const payload = await verifyJWT(token, secret)
    if (payload) {
      c.set('auth', payload)
    }
  }

  await next()
}
