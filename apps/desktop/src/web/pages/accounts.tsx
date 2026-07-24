/**
 * Accounts page — `/accounts`.
 *
 * Placeholder for account management and sync UI.
 * Will be implemented in Phase 4 (Accounts & Sync).
 */
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { User, Plus, RefreshCw, Download, MoreVertical } from "lucide-react";

export default function AccountsPage() {
	return (
		<div className="mx-auto max-w-4xl p-8">
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
				<Button size="sm">
					<Plus className="mr-1.5 size-4" />
					Add Account
				</Button>
			</header>

			{/* Account cards */}
			<div className="space-y-4">
				{/* Chess.com placeholder */}
				<Card>
					<CardContent className="flex items-center justify-between py-4">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
								<span className="text-2xl">♟</span>
							</div>
							<div>
								<CardTitle className="text-base">Chess.com</CardTitle>
								<p className="text-sm text-neutral-500">Not connected</p>
							</div>
						</div>
						<Button variant="outline" size="sm">
							Connect
						</Button>
					</CardContent>
				</Card>

				{/* Lichess placeholder */}
				<Card>
					<CardContent className="flex items-center justify-between py-4">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800">
								<span className="text-2xl text-white">♞</span>
							</div>
							<div>
								<CardTitle className="text-base">Lichess</CardTitle>
								<p className="text-sm text-neutral-500">Not connected</p>
							</div>
						</div>
						<Button variant="outline" size="sm">
							Connect
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Info card */}
			<div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
				<h3 className="mb-1 font-medium text-blue-900">Why connect accounts?</h3>
				<ul className="space-y-1 text-sm text-blue-700">
					<li>• Automatically download your played games</li>
					<li>• Track your rating history and progress</li>
					<li>• Analyze your online games with the engine</li>
				</ul>
			</div>

			<div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center">
				<p className="text-neutral-500">
					Accounts page will be fully implemented in Phase 4.
				</p>
			</div>
		</div>
	);
}
