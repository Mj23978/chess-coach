/**
 * TitleBar — custom window title bar with menus and window controls.
 *
 * For Electrobun desktop app: provides File/Edit/View menus and
 * minimize/maximize/close buttons. The search bar is a placeholder for now.
 */
import { useState } from "react";
import {
	Minus,
	Square,
	X,
	Search,
	Menu,
	FileText,
	Download,
	Upload,
	Undo,
	Redo,
	Copy,
	Clipboard,
	Maximize2,
	Minimize2,
	Bug,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";

interface TitleBarProps {
	onNewGame?: () => void;
	onImportPgn?: () => void;
	onExportPgn?: () => void;
	onToggleSidebar?: () => void;
}

export function TitleBar({
	onNewGame,
	onImportPgn,
	onExportPgn,
	onToggleSidebar,
}: TitleBarProps) {
	const [isMaximized, setIsMaximized] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	// Window controls - these would call Electrobun APIs in production
	const handleMinimize = () => {
		// TODO: Call Electrobun API to minimize window
		console.log("Minimize window");
	};

	const handleMaximize = () => {
		setIsMaximized(!isMaximized);
		// TODO: Call Electrobun API to toggle maximize
		console.log("Toggle maximize");
	};

	const handleClose = () => {
		// TODO: Call Electrobun API to close window
		console.log("Close window");
	};

	const handleToggleDevTools = () => {
		// TODO: Call Electrobun API to toggle dev tools
		console.log("Toggle dev tools");
	};

	return (
		<div className="flex h-10 items-center justify-between border-b border-neutral-200 bg-neutral-100 px-2 app-drag">
			{/* Left: Menu bar */}
			<div className="flex items-center gap-1 app-no-drag">
				{/* Sidebar toggle */}
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={onToggleSidebar}
					title="Toggle Sidebar (Ctrl+B)"
				>
					<Menu className="size-4" />
				</Button>

				{/* File Menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
							File
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="min-w-[180px]">
						<DropdownMenuItem onClick={onNewGame}>
							<FileText className="mr-2 size-4" />
							New Game
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onImportPgn}>
							<Upload className="mr-2 size-4" />
							Import PGN...
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onExportPgn}>
							<Download className="mr-2 size-4" />
							Export PGN...
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleClose}>
							<X className="mr-2 size-4" />
							Quit
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Edit Menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
							Edit
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="min-w-[180px]">
						<DropdownMenuItem>
							<Undo className="mr-2 size-4" />
							Undo
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Redo className="mr-2 size-4" />
							Redo
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<Copy className="mr-2 size-4" />
							Copy FEN
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Clipboard className="mr-2 size-4" />
							Paste FEN
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* View Menu */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
							View
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="min-w-[180px]">
						<DropdownMenuItem onClick={onToggleSidebar}>
							<Menu className="mr-2 size-4" />
							Toggle Sidebar
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleMaximize}>
							{isMaximized ? (
								<Minimize2 className="mr-2 size-4" />
							) : (
								<Maximize2 className="mr-2 size-4" />
							)}
							{isMaximized ? "Exit Full Screen" : "Full Screen"}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleToggleDevTools}>
							<Bug className="mr-2 size-4" />
							Developer Tools
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Center: Search bar (placeholder) */}
			<div className="flex-1 max-w-md mx-4 app-no-drag">
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
					<Input
						type="text"
						placeholder="Search games, openings..."
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						className="h-7 w-full bg-white pl-8 text-xs"
					/>
				</div>
			</div>

			{/* Right: Window controls */}
			<div className="flex items-center app-no-drag">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-none hover:bg-neutral-200"
					onClick={handleMinimize}
					title="Minimize"
				>
					<Minus className="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-none hover:bg-neutral-200"
					onClick={handleMaximize}
					title={isMaximized ? "Restore" : "Maximize"}
				>
					<Square className="size-3" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-none hover:bg-red-500 hover:text-white"
					onClick={handleClose}
					title="Close"
				>
					<X className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}
