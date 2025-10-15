import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { clientsTable, accountsTable, db } from '@/db'
import bcrypt from 'bcryptjs'
import { signJWT } from './utils/jwt'
import type { AuthContext } from './middleware/auth'
import { authMiddleware } from './middleware/auth'

type Bindings = {
  JWT_SECRET: string
}

const api = new Hono<AuthContext & { Bindings: Bindings }>()

// Apply auth middleware to all routes
api.use('*', authMiddleware)

api.post('/clients', async (c) => {
  const body = await c.req.json()
  const { id } = body

  if (!id) {
    return c.json({ error: 'missing id' }, 400)
  }

  try {
    await db
      .insert(clientsTable)
      .values({ id })
      .onConflictDoNothing()

    return c.json({ success: true, id }, 201)
  } catch (error) {
    return c.json({ error: "Failed to create client" }, 500)
  }
})

// POST /api/accounts/:id/authToken - Authenticate and get JWT
api.post('/accounts/:id/authToken', async (c) => {
  const accountId: string = c.req.param('id')
  const body = await c.req.json()
  const { password } = body

  if (!password) {
    return c.json({ error: 'password is required' }, 400)
  }

  try {
    // Get account from database
    const accounts = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, accountId))
      .limit(1)

    if (accounts.length === 0) {
      return c.json({ error: 'Account not found' }, 404)
    }

    const account = accounts[0]

    // Check if account has a password set
    if (!account?.password) {
      return c.json({ error: 'Account has no password set' }, 401)
    }

    // Verify password
    const isValid = await bcrypt.compare(password, account.password)
    if (!isValid) {
      return c.json({ error: 'Invalid password' }, 401)
    }

    // Get existing authorized accounts from JWT if present
    const existingAuth = c.get('auth')
    const authorizedAccounts = existingAuth?.authorizedAccounts || []

    // Add this account to the list if not already there
    if (!authorizedAccounts.includes(accountId)) {
      authorizedAccounts.push(accountId)
    }

    // Generate JWT with updated authorized accounts
    const secret = c.env.JWT_SECRET
    const token = await signJWT({ authorizedAccounts }, secret)

    return c.json({ token }, 200)
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// GET /api/accounts - List accounts with permission-based filtering
api.get('/accounts', async (c) => {
  const auth = c.get('auth')

  try {
    const accounts = await db.select().from(accountsTable)

    // Filter response based on authorization
    const response = accounts.map((account) => {
      const hasAccess = auth?.authorizedAccounts.includes(account.id)

      if (hasAccess) {
        // Return all fields including birthday
        return {
          id: account.id,
          name: account.name,
          birthday: account.birthday,
        }
      } else {
        // Return only id and name
        return {
          id: account.id,
          name: account.name,
        }
      }
    })

    return c.json({ accounts: response }, 200)
  } catch (error) {
    console.error('Get accounts error:', error)
    return c.json({ error: 'Failed to get accounts' }, 500)
  }
})

api.post('/accounts', async (c) => {
  const body = await c.req.json()
  const { name, birthday, password } = body

  if (!name || !birthday) {
    return c.json({ error: 'name and birthday are required' }, 400)
  }

  try {
    let hashedPassword = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    const result = await db
      .insert(accountsTable)
      .values({
        name,
        birthday,
        password: hashedPassword,
      })
      .returning({ id: accountsTable.id })

    return c.json({ success: true, id: result[0]?.id }, 201)
  } catch (error) {
    console.error('Create account error:', error)
    return c.json({ error: 'Failed to create account' }, 500)
  }
})

export default api
