import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthenticateAccount } from '../hooks/useAccounts'
import { toast } from 'sonner'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountId: string
  accountName: string
}

export function AuthDialog({
  open,
  onOpenChange,
  accountId,
  accountName,
}: AuthDialogProps) {
  const [password, setPassword] = useState('')
  const authenticateMutation = useAuthenticateAccount()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await authenticateMutation.mutateAsync({ accountId, password })
      toast.success(`已成功認證 ${accountName}`)
      onOpenChange(false)
      setPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '認證失敗')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>認證帳號</DialogTitle>
            <DialogDescription>
              輸入 {accountName} 的密碼以存取完整資訊
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!password || authenticateMutation.isPending}
            >
              {authenticateMutation.isPending ? '認證中...' : '確認'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
