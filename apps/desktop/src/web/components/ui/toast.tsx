/**
 * Imperative toast API + <Toaster/> renderer.
 *
 * The design-system toast (`@repo/ui/components/toast`) only ships the Radix
 * primitives (`<Toast>`, `<ToastProvider>`, …) — there is no imperative
 * `toast.success("…")` surface. This module fills that gap:
 *
 *  - `toast.success / .error / .info(message)` push onto a tiny external store.
 *  - `<Toaster/>` subscribes to that store and renders one Radix `<Toast>` per
 *    active item, auto-dismissing after `duration` ms.
 *  - `TOAST_MESSAGES` is a small catalogue of ready-made strings used by the
 *    game-review and title-bar flows (FEN copy, PGN export, …).
 *
 * Mount `<Toaster/>` once near the app root, INSIDE a `<ToastProvider>` (see
 * App.tsx). The provider is the Radix context; `<Toaster/>` subscribes to the
 * store and renders the active toasts + the viewport under that context.
 */
import { useSyncExternalStore } from "react";
import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastTitle,
	ToastViewport,
} from "@repo/ui/components/toast";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type ToastVariant = "default" | "destructive" | "success" | "info";

interface ToastItem {
	id: number;
	title?: string;
	description: string;
	variant: ToastVariant;
	duration: number;
}

let nextId = 1;
let items: ToastItem[] = [];
const listeners = new Set<() => void>();

function emit() {
	for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
	listeners.add(cb);
	return () => listeners.delete(cb);
}

function push(
	description: string,
	opts?: {
		title?: string;
		variant?: ToastVariant;
		duration?: number;
	},
): number {
	const id = nextId++;
	const item: ToastItem = {
		id,
		description,
		variant: opts?.variant ?? "default",
		title: opts?.title,
		duration: opts?.duration ?? 4000,
	};
	items = [...items, item];
	emit();
	return id;
}

function dismiss(id: number): void {
	items = items.filter((i) => i.id !== id);
	emit();
}

/** Imperative API. Each call shows one toast; auto-dismissed by <Toaster/>. */
export const toast = {
	success: (msg: string, opts?: { title?: string; duration?: number }) =>
		push(msg, { ...opts, variant: "success" }),
	error: (msg: string, opts?: { title?: string; duration?: number }) =>
		push(msg, { ...opts, variant: "destructive" }),
	info: (msg: string, opts?: { title?: string; duration?: number }) =>
		push(msg, { ...opts, variant: "info" }),
	dismiss,
};

/** Shared message catalogue so call-sites stay consistent. */
export const TOAST_MESSAGES = {
	FEN_COPIED: "FEN copied to clipboard",
	PGN_EXPORTED: "PGN exported",
	GAME_IMPORTED: "Game imported",
	ENGINE_ACTIVATED: "Engine activated",
	ENGINE_ADDED: "Engine added",
	FILE_IMPORTED: "File imported",
	FILE_DELETED: "File deleted",
	ACCOUNT_SYNCED: "Account synced",
} as const;

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

/** Variant → Tailwind classes (overlaid on the design-system base). */
const VARIANT_CLASS: Record<ToastVariant, string> = {
	default: "border-neutral-200 bg-white text-neutral-900",
	destructive: "border-red-300 bg-red-50 text-red-900",
	success: "border-emerald-300 bg-emerald-50 text-emerald-900",
	info: "border-blue-300 bg-blue-50 text-blue-900",
};

/**
 * Mount once at the app root, inside <ToastProvider/>. Renders the active
 * toasts into the design-system primitives and wires auto-dismiss.
 */
export function Toaster() {
	const snapshot = useSyncExternalStore(
		subscribe,
		() => items,
		() => items,
	);

	return (
		<>
			{snapshot.map((t) => (
				<Toast
					key={t.id}
					duration={t.duration}
					className={VARIANT_CLASS[t.variant]}
					onOpenChange={(open) => {
						if (!open) dismiss(t.id);
					}}
				>
					<div className="flex-1">
						{t.title && <ToastTitle>{t.title}</ToastTitle>}
						<ToastDescription>{t.description}</ToastDescription>
					</div>
					<ToastClose />
				</Toast>
			))}
			<ToastViewport />
		</>
	);
}
