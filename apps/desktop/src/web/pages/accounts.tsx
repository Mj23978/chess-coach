/**
 * Accounts page — `/accounts`.
 *
 * Lists connected Chess.com / Lichess identities (AccountCard each), with an
 * Add Account modal (Chess.com username or Lichess OAuth) and a per-account
 * PlayerDatabaseDrawer (opened from a card). Fetches the account list via
 * React Query (`["accounts"]`); each card fetches its own live ratings.
 *
 * Chess.com uses the public API (no login). Lichess uses an OAuth popup that
 * lands on the in-process server's `/auth/lichess/callback` — see
 * AddAccountModal for the polling fallback.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@repo/ui/components/button";
import { Plus, User } from "lucide-react";
import {
	AccountCard,
	AddAccountModal,
	PlayerDatabaseDrawer,
} from "../components/accounts";
import { PageContainer, PageHeader } from "../components/layout";
import { ErrorState } from "../components/ui";
import { fetchAccounts, type AccountDTO } from "../lib/api";

export default function AccountsPage() {
	const [addOpen, setAddOpen] = useState(false);
	const [drawerAccount, setDrawerAccount] = useState<AccountDTO | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const { data: accounts, isLoading, error, refetch } = useQuery({
		queryKey: ["accounts"],
		queryFn: fetchAccounts,
	});

	function openDatabase(account: AccountDTO) {
		// Keep the latest account snapshot in the drawer (keyed queries refetch).
		setDrawerAccount(account);
		setDrawerOpen(true);
	}

	return (
		<PageContainer>
			<PageHeader
				title="Accounts"
				subtitle="Connect your Chess.com and Lichess accounts to sync games."
				icon={<User className="size-5" />}
				backTo="/"
				backLabel="Dashboard"
				actions={
					<Button size="sm" onClick={() => setAddOpen(true)}>
						<Plus className="mr-1.5 size-4" />
						Add Account
					</Button>
				}
			/>

			{isLoading && (
				<p className="py-8 text-sm text-muted-foreground">Loading accounts…</p>
			)}
			{error && (
				<ErrorState
					title="Couldn't load accounts"
					description="We had trouble reading your connected accounts. Please try again."
					detail={String(error)}
					onRetry={() => refetch()}
				/>
			)}

			{!isLoading && accounts?.length === 0 && (
				<div className="rounded-lg border border-dashed border-border p-10 text-center">
					<p className="font-medium">No accounts connected yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Connect Chess.com or Lichess to automatically download your games.
					</p>
					<Button className="mt-4" onClick={() => setAddOpen(true)}>
						<Plus className="mr-1.5 size-4" />
						Add your first account
					</Button>
				</div>
			)}

			<div className="space-y-3">
				{accounts?.map((account) => (
					<AccountCard
						key={account.id}
						account={account}
						onOpenDatabase={openDatabase}
					/>
				))}
			</div>

			<div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-4">
				<h3 className="mb-1 font-medium text-blue-900">
					Why connect accounts?
				</h3>
				<ul className="space-y-1 text-sm text-blue-700">
					<li>• Automatically download your played games</li>
					<li>• Track your rating history and progress</li>
					<li>• Analyze your online games with the engine</li>
				</ul>
			</div>

			{addOpen && (
				<AddAccountModal
					onClose={() => setAddOpen(false)}
					onSuccess={() => setAddOpen(false)}
				/>
			)}

			<PlayerDatabaseDrawer
				account={drawerAccount}
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
			/>
		</PageContainer>
	);
}
