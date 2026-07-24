"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTranslations } from "@repo/i18n";
import { useTheme } from "next-themes";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./dropdown-menu";

const themes = [
	{ label: "light", value: "light" },
	{ label: "dark", value: "dark" },
	{ label: "system", value: "system" },
];

export const ModeToggle = ({
	variant = "outline",
}: {
	variant?: "ghost" | "outline" | "default";
}): React.JSX.Element => {
	const { setTheme } = useTheme();
	const t = useTranslations("common.toggles.mode");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={variant}
					size="icon"
					className="shrink-0 text-foreground"
				>
					<SunIcon className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
					<MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{themes.map(({ label, value }) => (
					<DropdownMenuItem key={value} onClick={() => setTheme(value)}>
						<p className="text-center w-full">{t(label as any)}</p>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
