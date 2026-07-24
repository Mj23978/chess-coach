"use client";

import { toast } from "../hooks/use-toast";

export function handleErrorWithToast(error: Error | unknown, message?: string) {
	const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

	toast({
		title: "Error",
		description: message ? `${message}: ${errorMessage}` : errorMessage,
		variant: "destructive",
	});
}

export function showSuccessToast(message: string) {
	toast({
		title: "Success",
		description: message,
	});
}

export function showInfoToast(message: string) {
	toast({
		title: "Info",
		description: message,
	});
}

export function showWarningToast(message: string) {
	toast({
		title: "Warning",
		description: message,
		variant: "destructive",
	});
}