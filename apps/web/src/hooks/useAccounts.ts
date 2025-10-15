import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: api.accounts.list,
  })
}

export function useAuthenticateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, password }: { accountId: string; password: string }) =>
      api.accounts.authenticate(accountId, password),
    onSuccess: () => {
      // Refetch accounts after authentication to get updated access
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.accounts.create,
    onSuccess: () => {
      // Refetch accounts after creating a new one
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
