import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Change, type Transaction } from '../lib/api'

export function useChanges(accountId: string, since?: number) {
  return useQuery({
    queryKey: ['changes', accountId, since],
    queryFn: () => api.changes.list(accountId, since),
    enabled: !!accountId,
  })
}

export function usePushChanges(accountId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (changes: Change[]) => api.changes.push(accountId, changes),
    onSuccess: () => {
      // Refetch changes after push
      queryClient.invalidateQueries({ queryKey: ['changes', accountId] })
      queryClient.invalidateQueries({ queryKey: ['transactions', accountId] })
    },
  })
}

// Helper to extract transactions from changes
export function useTransactions(accountId: string) {
  const { data: changes, ...rest } = useChanges(accountId)

  const transactions: Transaction[] = []

  if (changes) {
    for (const change of changes) {
      if (change.table === 'txs' && change.op === 'insert' && change.payload) {
        transactions.push(change.payload as Transaction)
      }
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    return b.createdAt - a.createdAt
  })

  return {
    ...rest,
    data: transactions,
  }
}

// Calculate balance from transactions
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0)
}
