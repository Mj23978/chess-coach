/**
 * AddAccountModal — connect a Chess.com or Lichess account.
 *
 *  - Chess.com: enter a username → `POST /accounts` validates it against the
 *    pubapi and creates the row immediately (Chess.com needs no auth).
 *  - Lichess: `POST /accounts` returns an OAuth authorize URL; we open it in a
 *    popup, then poll `fetchAccounts()` until the new Lichess identity appears
 *    (the OAuth callback page also best-effort postMessages the opener, but the
 *    popup may open in a system browser outside the webview, so polling is the
 *    robust path). Times out after 2 minutes.
 *
 * Uses a raw overlay (matching the engines-page modal convention) rather than
 * the @repo/ui Dialog, to stay consistent with the rest of the SPA.
 */
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	createAccount,
	fetchAccounts,
	type AccountPlatform,
} from "../../lib/api";

type Platform = AccountPlatform;

interface AddAccountModalProps {
	onClose: () => void;
	onSuccess: () => void;
}

export function AddAccountModal({ onClose, onSuccess }: AddAccountModalProps) {
	const [platform, setPlatform] = useState<Platform | null>(null);
	const [username, setUsername] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lichessWaiting, setLichessWaiting] = useState(false);

	const qc = useQueryClient();
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Clean up any polling if the modal unmounts mid-OAuth.
	useEffect(() => {
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, []);

	async function connectChessCom() {
		setError(null);
		setSubmitting(true);
		try {
			await createAccount({ platform: "chess.com", username: username.trim() });
			await qc.invalidateQueries({ queryKey: ["accounts"] });
			await qc.invalidateQueries({ queryKey: ["games"] });
			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to connect");
		} finally {
			setSubmitting(false);
		}
	}

	async function connectLichess() {
		setError(null);
		setSubmitting(true);
		try {
			// Count existing Lichess accounts so polling can detect the new one.
			const before = (await fetchAccounts()).filter(
				(a) => a.platform === "lichess",
			).length;

			const res = await createAccount({ platform: "lichess" });
			if (!("requiresOAuth" in res)) {
				// Unexpected (created directly) — just finish.
				await qc.invalidateQueries({ queryKey: ["accounts"] });
				onSuccess();
				return;
			}

			const popup = window.open(res.authUrl, "lichess-oauth", "width=600,height=720");
			if (!popup) {
				setError(
					"Popup blocked. Allow popups for this app, or copy this link into your browser:\n" +
						res.authUrl,
				);
				setSubmitting(false);
				return;
			}

			setLichessWaiting(true);
			setSubmitting(false);

			const deadline = Date.now() + 2 * 60 * 1000;
			pollRef.current = setInterval(async () => {
				if (Date.now() > deadline) {
					stopPoll();
					setLichessWaiting(false);
					setError("Timed out waiting for Lichess authorization.");
					return;
				}
				try {
					const accounts = await fetchAccounts();
					const lichess = accounts.filter((a) => a.platform === "lichess");
					if (lichess.length > before) {
						stopPoll();
						setLichessWaiting(false);
						await qc.invalidateQueries({ queryKey: ["accounts"] });
						await qc.invalidateQueries({ queryKey: ["games"] });
						onSuccess();
					}
				} catch {
					// Transient fetch error — keep polling.
				}
			}, 1500);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to start OAuth");
			setSubmitting(false);
		}
	}

	function stopPoll() {
		if (pollRef.current) {
			clearInterval(pollRef.current);
			pollRef.current = null;
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Connect an account</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{!platform && (
						<div className="grid grid-cols-2 gap-3">
							<PlatformChoice
								name="Chess.com"
								desc="Public API — no login needed"
								className="bg-emerald-500"
								onClick={() => setPlatform("chess.com")}
							/>
							<PlatformChoice
								name="Lichess"
								desc="OAuth sign-in"
								className="bg-neutral-800"
								onClick={() => setPlatform("lichess")}
							/>
						</div>
					)}

					{platform === "chess.com" && (
						<div className="space-y-3">
							<div>
								<label className="mb-1 block text-sm font-medium">
									Chess.com username
								</label>
								<Input
									autoFocus
									placeholder="e.g. magnuscarlsen"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && username.trim()) connectChessCom();
									}}
								/>
								<p className="mt-1 text-xs text-neutral-500">
									We use the public Chess.com API — your password is never
									requested.
								</p>
							</div>
							{error && <p className="text-sm text-red-600">{error}</p>}
							<div className="flex justify-between">
								<Button variant="outline" onClick={() => setPlatform(null)}>
									Back
								</Button>
								<Button
									onClick={connectChessCom}
									disabled={!username.trim() || submitting}
								>
									{submitting ? "Connecting…" : "Connect"}
								</Button>
							</div>
						</div>
					)}

					{platform === "lichess" && (
						<div className="space-y-3">
							{lichessWaiting ? (
								<div className="space-y-2 text-center">
									<p className="text-sm text-neutral-600">
										Complete the sign-in in the opened Lichess window. This dialog
										will close automatically once connected.
									</p>
									<p className="text-xs text-neutral-400">
										Waiting for authorization…
									</p>
								</div>
							) : (
								<>
									<p className="text-sm text-neutral-600">
										You'll be redirected to lichess.org to authorize chess-coach to
										read your games. We only request the{" "}
										<code className="rounded bg-neutral-100 px-1">game:read</code>{" "}
										scope.
									</p>
									{error && <p className="text-sm text-red-600">{error}</p>}
									<div className="flex justify-between">
										<Button variant="outline" onClick={() => setPlatform(null)}>
											Back
										</Button>
										<Button onClick={connectLichess} disabled={submitting}>
											{submitting ? "Starting…" : "Connect with Lichess"}
										</Button>
									</div>
								</>
							)}
						</div>
					)}

					{!lichessWaiting && (
						<div className="flex justify-end border-t pt-3">
							<Button variant="ghost" onClick={onClose}>
								Cancel
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function PlatformChoice({
	name,
	desc,
	className,
	onClick,
}: {
	name: string;
	desc: string;
	className: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex flex-col items-start gap-2 rounded-lg border border-neutral-200 p-4 text-left transition hover:border-neutral-400 hover:bg-neutral-50"
		>
			<span
				className={`flex h-8 w-8 items-center justify-center rounded-md text-white ${className}`}
			>
				♟
			</span>
			<span className="font-medium">{name}</span>
			<span className="text-xs text-neutral-500">{desc}</span>
		</button>
	);
}
