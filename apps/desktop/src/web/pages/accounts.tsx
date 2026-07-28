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
import { Plus } from "lucide-react";
import {
	AccountCard,
	AddAccountModal,
	PlayerDatabaseDrawer,
} from "../components/accounts";
import { PageContainer } from "../components/layout";
import { fetchAccounts, type AccountDTO } from "../lib/api";

export default function AccountsPage() {
	const [addOpen, setAddOpen] = useState(false);
	const [drawerAccount, setDrawerAccount] = useState<AccountDTO | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);

	const { data: accounts, isLoading, error } = useQuery({
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
			<header className="mb-6 flex items-start justify-between">
				<div>
					<Link to="/" className="text-xs text-blue-600">
						← Dashboard
					</Link>
					<h1 className="mt-1 text-2xl font-bold">Accounts</h1>
					<p className="text-sm text-neutral-500">
						Connect your Chess.com and Lichess accounts to sync games.
					</p>
				</div>
				<Button size="sm" onClick={() => setAddOpen(true)}>
					<Plus className="mr-1.5 size-4" />
					Add Account
				</Button>
			</header>

			{isLoading && (
				<p className="py-8 text-sm text-neutral-500">Loading accounts…</p>
			)}
			{error && (
				<p className="py-8 text-sm text-rose-600">
					Failed to load accounts: {String(error)}
				</p>
			)}

			{!isLoading && accounts?.length === 0 && (
				<div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
					<p className="font-medium">No accounts connected yet</p>
					<p className="mt-1 text-sm text-neutral-500">
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
