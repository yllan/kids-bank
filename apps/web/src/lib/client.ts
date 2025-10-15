import { ulid } from 'ulid'

const CLIENT_ID_KEY = 'kids-bank-client-id'

export function getClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY)

  if (!clientId) {
    clientId = ulid()
    localStorage.setItem(CLIENT_ID_KEY, clientId)
  }

  return clientId
}

export function clearClientId(): void {
  localStorage.removeItem(CLIENT_ID_KEY)
}
