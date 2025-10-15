import { getClientId } from './client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const JWT_TOKEN_KEY = 'kids-bank-jwt-token'
const CLIENT_REGISTERED_KEY = 'kids-bank-client-registered'

export function getJwtToken(): string | null {
  return localStorage.getItem(JWT_TOKEN_KEY)
}

export function setJwtToken(token: string): void {
  localStorage.setItem(JWT_TOKEN_KEY, token)
}

export function clearJwtToken(): void {
  localStorage.removeItem(JWT_TOKEN_KEY)
}

async function ensureClientRegistered(): Promise<void> {
  const isRegistered = localStorage.getItem(CLIENT_REGISTERED_KEY)
  if (isRegistered) {
    return
  }

  const clientId = getClientId()
  try {
    const response = await fetch(`${API_BASE_URL}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId }),
    })

    if (response.ok) {
      localStorage.setItem(CLIENT_REGISTERED_KEY, 'true')
    }
  } catch (error) {
    console.error('Failed to register client:', error)
  }
}

async function fetchAPI(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure client is registered before making API calls
  await ensureClientRegistered()

  const token = getJwtToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  return response
}

export interface Account {
  id: string
  name: string
  birthday?: string
  hasAccess: boolean
}

export interface Change {
  ver?: number
  hash?: string
  account?: string
  op: string
  table: string
  key?: string
  payload?: any
  client: string
  createdAt?: number
}

export interface Transaction {
  id: string
  account: string
  description?: string
  amount: number
  date: string
  rule?: string
  createdAt: number
  updatedAt: number
  deletedAt: number
}

export const api = {
  accounts: {
    list: async (): Promise<Account[]> => {
      const response = await fetchAPI('/api/accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }
      const data = await response.json()
      return data.accounts
    },

    authenticate: async (accountId: string, password: string): Promise<string> => {
      const response = await fetchAPI(`/api/accounts/${accountId}/authToken`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Authentication failed')
      }

      const data = await response.json()
      setJwtToken(data.token)
      return data.token
    },

    create: async (account: {
      name: string
      birthday: string
      password?: string
    }): Promise<{ id: string }> => {
      const response = await fetchAPI('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(account),
      })

      if (!response.ok) {
        throw new Error('Failed to create account')
      }

      const data = await response.json()
      return { id: data.id }
    },
  },

  changes: {
    list: async (accountId: string, since?: number): Promise<Change[]> => {
      const url = since
        ? `/api/accounts/${accountId}/changes?since=${since}`
        : `/api/accounts/${accountId}/changes`

      const response = await fetchAPI(url)
      if (!response.ok) {
        throw new Error('Failed to fetch changes')
      }
      const data = await response.json()
      return data.changes
    },

    push: async (accountId: string, changes: Change[]): Promise<Change[]> => {
      const response = await fetchAPI(`/api/accounts/${accountId}/changes`, {
        method: 'POST',
        body: JSON.stringify({ changes }),
      })

      if (!response.ok) {
        throw new Error('Failed to push changes')
      }

      const data = await response.json()
      return data.changes
    },
  },
}
