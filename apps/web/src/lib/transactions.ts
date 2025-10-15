import { ulid } from 'ulid'
import { getClientId } from './client'
import type { Change, Transaction } from './api'

export interface TransactionInput {
  account: string
  description?: string
  amount: number
  date: string
}

export function createTransactionChange(input: TransactionInput): Change {
  const now = Date.now()

  const transaction: Omit<Transaction, 'id' | 'deletedAt'> = {
    account: input.account,
    description: input.description,
    amount: input.amount,
    date: input.date,
    createdAt: now,
    updatedAt: now,
  }

  return {
    account: input.account,
    op: 'insert',
    table: 'txs',
    payload: transaction,
    client: getClientId(),
    createdAt: now,
  }
}

export function formatAmount(amount: number): string {
  const sign = amount >= 0 ? '+' : ''
  return `${sign}${amount.toLocaleString()}`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
