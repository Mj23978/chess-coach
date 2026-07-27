/**
 * Skeleton loading components (Phase 9: X2-001).
 *
 * Provides shimmer-animated placeholder shapes for common UI patterns:
 * card, table row, text, and avatar. Uses CSS animations for smooth loading.
 */
import { cn } from "@repo/ui/lib/utils";

interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
	return (
		<div
			className={cn(
				"animate-pulse rounded-md bg-neutral-200",
				className,
			)}
		/>
	);
}

/** Card-shaped skeleton for grid views (databases, files, engines). */
export function CardSkeleton() {
	return (
		<div className="rounded-xl border border-neutral-200 bg-white p-4">
			<div className="mb-3 flex items-center gap-3">
				<Skeleton className="size-11 rounded-lg" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-1/2" />
				</div>
			</div>
			<div className="space-y-2">
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-2/3" />
			</div>
			<div className="mt-4 flex gap-2">
				<Skeleton className="h-5 w-16 rounded-full" />
				<Skeleton className="h-5 w-20 rounded-full" />
			</div>
		</div>
	);
}

/** List row skeleton for list views. */
export function ListRowSkeleton() {
	return (
		<div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
			<Skeleton className="size-9 rounded-lg" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-4 w-1/3" />
				<Skeleton className="h-3 w-1/4" />
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-7 w-20 rounded" />
				<Skeleton className="h-7 w-7 rounded" />
			</div>
		</div>
	);
}

/** Table row skeleton for games table. */
export function TableRowSkeleton() {
	return (
		<tr className="border-b border-neutral-100">
			{Array.from({ length: 8 }).map((_, i) => (
				<td key={i} className="px-4 py-3">
					<Skeleton className="h-4 w-full" />
				</td>
			))}
		</tr>
	);
}

/** Page header skeleton. */
export function HeaderSkeleton() {
	return (
		<div className="mb-6 flex items-start justify-between gap-4">
			<div className="flex items-center gap-3">
				<Skeleton className="size-11 rounded-xl" />
				<div className="space-y-2">
					<Skeleton className="h-7 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<div className="flex gap-2">
				<Skeleton className="h-9 w-36 rounded-md" />
				<Skeleton className="h-9 w-28 rounded-md" />
			</div>
		</div>
	);
}

/** Board + move list skeleton for game review. */
export function GameReviewSkeleton() {
	return (
		<div className="mx-auto max-w-6xl p-6">
			<HeaderSkeleton />
			<div className="flex gap-6">
				<div className="flex gap-2">
					<Skeleton className="w-4 self-stretch rounded-sm" />
					<Skeleton className="size-[480px] rounded" />
				</div>
				<div className="min-w-[280px] flex-1 space-y-2 rounded-lg border border-neutral-200 p-3">
					<Skeleton className="h-8 w-full" />
					{Array.from({ length: 12 }).map((_, i) => (
						<div key={i} className="flex gap-4">
							<Skeleton className="h-5 w-8" />
							<Skeleton className="h-5 w-16" />
							<Skeleton className="h-5 w-16" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/** Dashboard skeleton with cards. */
export function DashboardSkeleton() {
	return (
		<div className="mx-auto max-w-6xl p-8">
			<HeaderSkeleton />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<CardSkeleton key={i} />
				))}
			</div>
		</div>
	);
}
