/**
 * BoardErrorBoundary — guards the <Chessboard/> (chessground) render.
 *
 * chessground + its native asset loading can throw at render time (bad FEN,
 * missing piece-theme assets, WebView2 quirks). A thrown error inside the
 * board would otherwise blank the whole game-review page. This boundary
 * catches it and shows a compact recovery card with a "Reset" affordance.
 *
 * Class component because React still requires `componentDidCatch` for error
 * boundaries (no hook equivalent as of React 19).
 */
import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	/** Optional fallback; defaults to the inline recovery card. */
	fallback?: (error: Error, reset: () => void) => ReactNode;
}
interface State {
	error: Error | null;
}

export class BoardErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: Error): State {
		return { error };
	}

	componentDidCatch(error: Error, info: { componentStack: string }) {
		// Surfaced to the console so the owner can trace the underlying cause;
		// the boundary itself keeps the UI standing.
		console.error("[BoardErrorBoundary] chessground render failed:", error, info);
	}

	reset = () => this.setState({ error: null });

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;
		if (this.props.fallback) return this.props.fallback(error, this.reset);
		return (
			<div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
				<p className="text-sm font-medium text-destructive">
					Board failed to render
				</p>
				<p className="max-w-xs text-xs text-destructive">
					{error.message || "Unknown error"}
				</p>
				<button
					type="button"
					onClick={this.reset}
					className="rounded-md border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
				>
					Try again
				</button>
			</div>
		);
	}
}
