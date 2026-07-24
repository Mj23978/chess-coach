"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps, toast as sonnerToast } from "sonner";

// 1. Configure the Toaster to look like Shadcn UI Cards
const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
					error: "group-[.toaster]:text-destructive",
				},
			}}
			{...props}
		/>
	);
};

// 2. Define the types for the Shadcn-like API
type ToastProps = {
	title?: React.ReactNode;
	description?: React.ReactNode;
	variant?: "default" | "destructive" | "success" | "info";
	action?: {
		label: string;
		onClick: () => void;
	};
	duration?: number;
};

// 3. Create the wrapper function
function toast({ title, description, variant = "default", action, duration, ...props }: ToastProps) {
	const sonnerFunction =
		variant === "destructive" ? sonnerToast.error :
			variant === "success" ? sonnerToast.success :
				variant === "info" ? sonnerToast.info :
					sonnerToast;

	return sonnerFunction(title, {
		description,
		duration,
		action,
		...props,
	});
}

function useSonner() {
	return {
		toast,
		dismiss: sonnerToast.dismiss,
	};
}

export { Toaster, useSonner, toast };
