/**
 * ModalShell — a thin wrapper around Radix Dialog for simple confirmation /
 * input modals. Handles overlay click-to-close and Escape key automatically.
 *
 * Usage:
 *   <ModalShell title="..." open={open} onOpenChange={setOpen}>
 *     ...content...
 *   </ModalShell>
 *
 * The `footer` prop is optional; render your own buttons inside the children
 * if you need more layout control.
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";

export interface ModalShellProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	/** Extra classes on the DialogContent wrapper. */
	className?: string;
}

export function ModalShell({
	open,
	onOpenChange,
	title,
	description,
	children,
	footer,
	className,
}: ModalShellProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={className}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>

				{children}

				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	);
}
