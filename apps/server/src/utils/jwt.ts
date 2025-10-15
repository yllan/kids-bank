import { sign, verify } from 'hono/jwt'

export type JWTPayload = {
  authorizedAccounts: string[] // list of account IDs user has access to
  iat?: number
  exp?: number
}

export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const token = await sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 30, // 30 years
    },
    secret
  )
  return token
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}
