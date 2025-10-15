import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTransactions, calculateBalance, usePushChanges } from '../../hooks/useChanges'
import { useAccounts } from '../../hooks/useAccounts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatAmount, formatDate, createTransactionChange } from '../../lib/transactions'
import { toast } from 'sonner'

export const Route = createFileRoute('/accounts/$id')({
  component: AccountDetailComponent,
})

function AccountDetailComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: accounts } = useAccounts()
  const { data: transactions, isLoading, error } = useTransactions(id)
  const pushChangesMutation = usePushChanges(id)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  })

  const account = accounts?.find((a) => a.id === id)

  // Check if user has access
  if (account && !account.hasAccess) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">您需要先認證此帳號才能查看帳本</p>
          <Button onClick={() => navigate({ to: '/' })}>返回帳號列表</Button>
        </div>
      </div>
    )
  }

  const balance = transactions ? calculateBalance(transactions) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseInt(formData.amount)
    if (isNaN(amount)) {
      toast.error('請輸入有效的金額')
      return
    }

    try {
      const change = createTransactionChange({
        account: id,
        description: formData.description || undefined,
        amount,
        date: formData.date,
      })

      await pushChangesMutation.mutateAsync([change])
      toast.success('交易已新增')
      setShowAddDialog(false)
      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '新增失敗')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <p className="text-center text-muted-foreground">載入中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <p className="text-center text-destructive">載入失敗: {error.message}</p>
        <div className="text-center mt-4">
          <Button onClick={() => navigate({ to: '/' })}>返回帳號列表</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{account?.name}</h1>
            <p className="text-muted-foreground text-sm">ID: {id}</p>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>餘額</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(balance)}
          </p>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">交易明細</h2>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新增交易
          </Button>
        </div>

        <div className="space-y-2">
          {transactions && transactions.length > 0 ? (
            transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{tx.description || '未命名交易'}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                    <div className={`text-lg font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(tx.amount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">尚無交易記錄</p>
          )}
        </div>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>新增交易</DialogTitle>
              <DialogDescription>新增一筆收入或支出記錄</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="date">日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">金額（正數為收入，負數為支出）</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="例如：1000 或 -500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">描述（選填）</Label>
                <Input
                  id="description"
                  placeholder="例如：零用錢、買玩具"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button type="submit" disabled={pushChangesMutation.isPending}>
                {pushChangesMutation.isPending ? '新增中...' : '確認'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
