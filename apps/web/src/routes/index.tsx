import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { useTransactions, calculateBalance, usePushChanges } from "../hooks/useChanges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LockOpen, ChevronRight, Plus } from "lucide-react";
import { AuthDialog } from "@/components/auth-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatAmount, createTransactionChange } from "../lib/transactions";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function AccountBalance({ accountId }: { accountId: string }) {
	const { data: transactions, isLoading } = useTransactions(accountId);

	if (isLoading) {
		return <span className="text-lg text-muted-foreground">載入中...</span>;
	}

	const balance = transactions ? calculateBalance(transactions) : 0;

	return (
		<span className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
			{formatAmount(balance)}
		</span>
	);
}

function HomeComponent() {
	const { data: accounts, isLoading, error } = useAccounts();
	const [authDialog, setAuthDialog] = useState<{ accountId: string; accountName: string } | null>(null);
	const [addTransactionDialog, setAddTransactionDialog] = useState<{ accountId: string; accountName: string } | null>(null);
	const [formData, setFormData] = useState({
		description: '',
		amount: '',
		type: 'expense' as 'income' | 'expense',
	});

	const pushChangesMutation = usePushChanges(addTransactionDialog?.accountId || '');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!addTransactionDialog) return;

		const amount = parseInt(formData.amount);
		if (isNaN(amount) || amount <= 0) {
			toast.error('請輸入有效的金額');
			return;
		}

		try {
			const finalAmount = formData.type === 'expense' ? -amount : amount;
			const change = createTransactionChange({
				account: addTransactionDialog.accountId,
				description: formData.description || undefined,
				amount: finalAmount,
				date: new Date().toISOString().split('T')[0],
			});

			await pushChangesMutation.mutateAsync([change]);
			toast.success('交易已新增');
			setAddTransactionDialog(null);
			setFormData({
				description: '',
				amount: '',
				type: 'expense',
			});
		} catch (error) {
			toast.error(error instanceof Error ? error.message : '新增失敗');
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-8">
				<p className="text-center text-muted-foreground">載入中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-8">
				<p className="text-center text-destructive">載入失敗: {error.message}</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-3xl px-4 py-8">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">帳號列表</h1>
				<p className="text-muted-foreground mt-2">選擇帳號進行認證以查看帳本</p>
			</div>

			<div className="grid gap-4">
				{accounts?.map((account) => (
					<Card key={account.id}>
						<CardHeader>
							<div className="flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<CardTitle className="flex items-center gap-2 text-2xl mb-2">
										{account.name}
										{account.hasAccess ? (
											<LockOpen className="h-5 w-5 text-green-500 flex-shrink-0" />
										) : (
											<Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
										)}
									</CardTitle>
									{account.hasAccess ? (
										<div>
											<AccountBalance accountId={account.id} />
										</div>
									) : (
										account.birthday && (
											<CardDescription className="text-base">
												生日: {account.birthday}
											</CardDescription>
										)
									)}
								</div>
								<div className="flex items-center gap-2 flex-shrink-0">
									{account.hasAccess ? (
										<>
											<Button
												onClick={() =>
													setAddTransactionDialog({ accountId: account.id, accountName: account.name })
												}
												variant="outline"
												size="sm"
											>
												<Plus className="h-4 w-4" />
											</Button>
											<Link to="/accounts/$id" params={{ id: account.id }}>
												<Button variant="default" size="sm">
													查看帳本
													<ChevronRight className="h-4 w-4 ml-1" />
												</Button>
											</Link>
										</>
									) : (
										<Button
											onClick={() =>
												setAuthDialog({ accountId: account.id, accountName: account.name })
											}
											variant="outline"
											size="sm"
										>
											認證
										</Button>
									)}
								</div>
							</div>
						</CardHeader>
					</Card>
				))}
			</div>

			{authDialog && (
				<AuthDialog
					open={!!authDialog}
					onOpenChange={(open) => !open && setAuthDialog(null)}
					accountId={authDialog.accountId}
					accountName={authDialog.accountName}
				/>
			)}

			{addTransactionDialog && (
				<Dialog open={!!addTransactionDialog} onOpenChange={(open) => !open && setAddTransactionDialog(null)}>
					<DialogContent className="sm:max-w-[425px]">
						<form onSubmit={handleSubmit}>
							<DialogHeader>
								<DialogTitle>新增交易 - {addTransactionDialog.accountName}</DialogTitle>
								<DialogDescription>新增一筆收入或支出記錄</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label>金額</Label>
									<div className="flex gap-2">
										<Button
											type="button"
											variant={formData.type === 'expense' ? 'default' : 'outline'}
											className="w-20 flex-shrink-0"
											onClick={() => setFormData({ ...formData, type: 'expense' })}
										>
											支出
										</Button>
										<Button
											type="button"
											variant={formData.type === 'income' ? 'default' : 'outline'}
											className="w-20 flex-shrink-0"
											onClick={() => setFormData({ ...formData, type: 'income' })}
										>
											收入
										</Button>
										<Input
											id="amount"
											type="number"
											placeholder="例如：1000"
											value={formData.amount}
											onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
											required
											min="1"
											className={`flex-1 ${formData.type === 'expense' ? 'text-red-600' : 'text-green-600'} font-semibold`}
										/>
									</div>
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
								<Button type="button" variant="outline" onClick={() => setAddTransactionDialog(null)}>
									取消
								</Button>
								<Button type="submit" disabled={pushChangesMutation.isPending}>
									{pushChangesMutation.isPending ? '新增中...' : '確認'}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
