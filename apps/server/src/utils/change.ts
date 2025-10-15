import { changesTable } from "@/db"

type Change = typeof changesTable.$inferSelect

export const changeHash = (change: Change): Promise<string> => {
  const { account, op, table, key, payload, client, createdAt } = change
  // Create a SHA-256 hash of the change fields
  // Format: `${account}|${op}|${table}|${key}|${JSON.stringify(payload)}|${client}|${createdAt}`
  const message = `${account}|${op}|${table}|${key}|${JSON.stringify(payload)}|${client}|${createdAt}`
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(message)).then((hashBuffer) => {
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  })
}