import { cn } from "@repo/ui/lib/utils";

export const Divider = ({ className }: { className?: string }) => (
	<div className={cn("h-px w-full border-b border-gray-200 mt-1", className)} />
);

export default Divider;
