/**
 * ConnectedAccountsCard (D1-004) — quick summary of synced Chess.com/Lichess
 * accounts, shown on the dashboard.
 *
 * Fetches the account list itself (`["accounts"]`) and renders one row per
 * platform: connected accounts show their username + synced-game count;
 * unconnected platforms show a "Connect" link to the Accounts page.
 */
import { useQuery } from "@tanstack/react-query";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchAccounts } from "../../lib/api";

export function ConnectedAccountsCard() {
	const { data: accounts } = useQuery({
		queryKey: ["accounts"],
		queryFn: fetchAccounts,
	});

	const chessCom = accounts?.find((a) => a.platform === "chess.com");
	const lichess = accounts?.find((a) => a.platform === "lichess");

	return (
		<Card className="h-full">
			<CardHeader className="flex flex-row items-center justify-between space-y-0">
				<CardTitle className="text-base">Connected Accounts</CardTitle>
				<Button asChild variant="ghost" size="sm">
					<Link to="/accounts">
						<Plus className="mr-1 size-4" />
						Add
					</Link>
				</Button>
			</CardHeader>
			<CardContent className="space-y-3">
				<AccountRow
					name="Chess.com"
					dotClass="bg-emerald-500"
					detail={
						chessCom
							? `${chessCom.username} · ${chessCom.gamesCount} games`
							: "Not connected"
					}
					connected={!!chessCom}
				/>
				<AccountRow
					name="Lichess"
					dotClass="bg-neutral-800"
					detail={
						lichess
							? `${lichess.username} · ${lichess.gamesCount} games`
							: "Not connected"
					}
					connected={!!lichess}
				/>
			</CardContent>
		</Card>
	);
}

function AccountRow({
	name,
	dotClass,
	detail,
	connected,
}: {
	name: string;
	dotClass: string;
	detail: string;
	connected: boolean;
}) {
	return (
		<div className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2">
			<div className="flex items-center gap-2.5">
				<span className={`size-2.5 rounded-full ${dotClass}`} />
				<div>
					<p className="text-sm font-medium">{name}</p>
					<p className="text-xs text-neutral-500">{detail}</p>
				</div>
			</div>
			{!connected && (
				<Button asChild variant="outline" size="sm">
					<Link to="/accounts">Connect</Link>
				</Button>
			)}
		</div>
	);
}
