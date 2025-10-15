import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAccounts } from "../hooks/useAccounts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, LockOpen, ChevronRight } from "lucide-react";
import { AuthDialog } from "@/components/auth-dialog";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const { data: accounts, isLoading, error } = useAccounts();
	const [authDialog, setAuthDialog] = useState<{ accountId: string; accountName: string } | null>(null);

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
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<CardTitle className="flex items-center gap-2">
										{account.name}
										{account.hasAccess ? (
											<LockOpen className="h-4 w-4 text-green-500" />
										) : (
											<Lock className="h-4 w-4 text-muted-foreground" />
										)}
									</CardTitle>
									<CardDescription>ID: {account.id}</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									{account.hasAccess ? (
										<Link to="/accounts/$id" params={{ id: account.id }}>
											<Button variant="default" size="sm">
												查看帳本
												<ChevronRight className="h-4 w-4 ml-1" />
											</Button>
										</Link>
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
						{account.birthday && (
							<CardContent>
								<p className="text-sm">
									<span className="font-medium">生日:</span> {account.birthday}
								</p>
							</CardContent>
						)}
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
		</div>
	);
}
