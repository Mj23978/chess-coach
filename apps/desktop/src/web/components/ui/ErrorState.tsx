/**
 * ErrorState — a friendly, recoverable empty/error state.
 *
 * Replaces the bare "Failed to load X: {error}" text blocks scattered across
 * pages with something that explains the problem and offers a way forward.
 *
 * Usage:
 *   <ErrorState
 *     title="Couldn't load games"
 *     description="We had trouble reading your games. Try again in a moment."
 *     onRetry={() => refetch()}
 *   />
 */
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface ErrorStateProps {
	/** Short headline shown bold. Defaults to "Something went wrong". */
	title?: string;
	/** Longer explanation. */
	description?: string;
	/** Optional technical detail appended muted. */
	detail?: string;
	/** Retry callback. When omitted, no retry button is shown. */
	onRetry?: () => void;
	/** Retry button label. */
	retryLabel?: string;
	/** Remove the card padding (useful inside tables). */
	bare?: boolean;
}

export function ErrorState({
	title = "Something went wrong",
	description,
	detail,
	onRetry,
	retryLabel = "Try again",
	bare = false,
}: ErrorStateProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center text-center ${
				bare ? "py-8" : "rounded-xl border border-border bg-card p-8"
			}`}
		>
			<div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
				<AlertCircle className="size-5" />
			</div>
			<h3 className="text-sm font-semibold text-foreground">{title}</h3>
			{description && (
				<p className="mt-1 max-w-sm text-xs text-muted-foreground">
					{description}
				</p>
			)}
			{detail && (
				<p className="mt-2 max-w-sm break-words font-mono text-[11px] text-muted-foreground/70">
					{detail}
				</p>
			)}
			{onRetry && (
				<Button
					variant="outline"
					size="sm"
					onClick={onRetry}
					className="mt-4"
				>
					<RotateCw className="mr-1.5 size-3.5" />
					{retryLabel}
				</Button>
			)}
		</div>
	);
}
