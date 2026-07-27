/**
 * Error boundary components (Phase 9: X2-002).
 *
 * Catches React render errors and displays a friendly fallback UI.
 * Includes both a generic boundary and specialized variants for
 * different contexts (board, data fetching, etc.).
 */
import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Generic error boundary that catches render errors.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		this.props.onError?.(error, errorInfo);
		// Log to console in development
		console.error("ErrorBoundary caught:", error, errorInfo);
	}

	handleRetry = (): void => {
		this.setState({ hasError: false, error: null });
	};

	override render(): ReactNode {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<ErrorFallback
					error={this.state.error}
					onRetry={this.handleRetry}
				/>
			);
		}

		return this.props.children;
	}
}

/**
 * Generic error fallback UI.
 */
function ErrorFallback({
	error,
	onRetry,
}: {
	error: Error | null;
	onRetry?: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center p-8 text-center">
			<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
				<AlertTriangle className="size-6" />
			</div>
			<h2 className="mb-2 text-lg font-semibold text-neutral-900">
				Something went wrong
			</h2>
			<p className="mb-4 max-w-md text-sm text-neutral-600">
				{error?.message ?? "An unexpected error occurred. Please try again."}
			</p>
			<div className="flex gap-2">
				{onRetry && (
					<Button variant="outline" onClick={onRetry}>
						<RefreshCw className="mr-1.5 size-4" />
						Try again
					</Button>
				)}
				<Button onClick={() => (window.location.href = "/")}>
					<Home className="mr-1.5 size-4" />
					Go home
				</Button>
			</div>
		</div>
	);
}

/**
 * Specialized error boundary for game/board contexts.
 */
export function BoardErrorBoundary({ children }: { children: ReactNode }) {
	return (
		<ErrorBoundary
			fallback={
				<div className="flex flex-col items-center justify-center p-8 text-center">
					<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
						<AlertTriangle className="size-6" />
					</div>
					<h2 className="mb-2 text-lg font-semibold">Board Error</h2>
					<p className="mb-4 text-sm text-neutral-600">
						The board couldn't be displayed. The position may be invalid.
					</p>
					<Button onClick={() => window.location.reload()}>
						<RefreshCw className="mr-1.5 size-4" />
						Reload
					</Button>
				</div>
			}
		>
			{children}
		</ErrorBoundary>
	);
}

/**
 * Specialized error boundary for data fetching contexts.
 */
export function DataErrorBoundary({
	children,
	onRetry,
}: {
	children: ReactNode;
	onRetry?: () => void;
}) {
	return (
		<ErrorBoundary
			onError={() => {
				// Could integrate with error tracking service here
			}}
		>
			{children}
		</ErrorBoundary>
	);
}

/**
 * Query error fallback for use with @tanstack/react-query.
 */
export function QueryErrorFallback({
	error,
	onRetry,
	onBack,
}: {
	error: Error;
	onRetry?: () => void;
	onBack?: () => void;
}) {
	const isNetworkError =
		error.message.includes("fetch") ||
		error.message.includes("network") ||
		error.message.includes("Network");

	return (
		<div className="flex flex-col items-center justify-center p-8 text-center">
			<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
				<AlertTriangle className="size-6" />
			</div>
			<h2 className="mb-2 text-lg font-semibold text-neutral-900">
				{isNetworkError ? "Connection error" : "Failed to load"}
			</h2>
			<p className="mb-4 max-w-md text-sm text-neutral-600">
				{isNetworkError
					? "Couldn't connect to the server. Please check your connection."
					: error.message}
			</p>
			<div className="flex gap-2">
				{onBack && (
					<Button variant="outline" onClick={onBack}>
						<ArrowLeft className="mr-1.5 size-4" />
						Go back
					</Button>
				)}
				{onRetry && (
					<Button onClick={onRetry}>
						<RefreshCw className="mr-1.5 size-4" />
						Retry
					</Button>
				)}
			</div>
		</div>
	);
}
