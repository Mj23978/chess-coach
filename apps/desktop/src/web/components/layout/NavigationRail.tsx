/**
 * NavigationRail — left sidebar navigation for chess-coach.
 *
 * Uses the @repo/ui Sidebar components with a collapsible rail pattern.
 * Shows icons when collapsed, full labels when expanded.
 *
 * Includes a search input in the header (moved from the removed TitleBar)
 * and a sidebar collapse toggle. Exposes an imperative focusSearch() handle
 * so the Ctrl+F shortcut (owned by AppShell) can focus search without a
 * global DOM querySelector.
 */
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
	Home,
	Grid3x3,
	Cpu,
	Database,
	FolderOpen,
	User,
	GraduationCap,
	Settings,
	Keyboard,
	PanelLeftClose,
	PanelLeftOpen,
	Search,
} from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarSeparator,
} from "@repo/ui/components/sidebar";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";

const mainNavItems = [
	{ id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
	{ id: "board", label: "Board", icon: Grid3x3, path: "/board" },
	{ id: "engines", label: "Engines", icon: Cpu, path: "/engines" },
	{ id: "databases", label: "Databases", icon: Database, path: "/databases" },
	{ id: "files", label: "Files", icon: FolderOpen, path: "/files" },
	{ id: "accounts", label: "Accounts", icon: User, path: "/accounts" },
	{ id: "train", label: "Train", icon: GraduationCap, path: "/train" },
];

const bottomNavItems = [
	{
		id: "keybindings",
		label: "Keybindings",
		icon: Keyboard,
		action: "keybindings",
	},
	{ id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

interface NavigationRailProps {
	onKeybindings?: () => void;
	onToggleSidebar?: () => void;
}

/**
 * Imperative surface exposed by <NavigationRail/> via ref. Lets the parent
 * (AppShell, via the Ctrl+F shortcut) focus the search input without reaching
 * into the DOM with a global querySelector.
 */
export interface NavigationRailHandle {
	/** Focus the header search input. No-op when the rail is collapsed (input hidden). */
	focusSearch: () => void;
}

export const NavigationRail = forwardRef<NavigationRailHandle, NavigationRailProps>(
	function NavigationRail({ onKeybindings, onToggleSidebar }, ref) {
		const location = useLocation();
		const currentPath = location.pathname;
		const [searchValue, setSearchValue] = useState("");
		// Container ref so focusSearch can reach the underlying <input> without
		// depending on @repo/ui's Input forwarding refs (it currently doesn't).
		// Scoped to this component's own DOM — no global querySelector.
		const searchContainerRef = useRef<HTMLDivElement>(null);

		useImperativeHandle(
			ref,
			() => ({
				focusSearch: () =>
					searchContainerRef.current?.querySelector("input")?.focus(),
			}),
			[],
		);

		return (
				<Sidebar collapsible="icon" variant="sidebar">
					<SidebarHeader className="h-14 border-b border-sidebar-border">
					{/* Expanded header: title + collapse button on the right. */}
					<div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
						<span className="text-lg font-bold">Chess Coach</span>
						<Button
							variant="ghost"
							size="icon"
							className="relative z-30 ml-auto h-8 w-8"
							onClick={onToggleSidebar}
							title="Collapse sidebar"
						>
							<PanelLeftClose className="size-4" />
						</Button>
					</div>

					{/*
						Collapsed header: only the expand button, centered.
						- z-30 lifts it above SidebarRail (z-20) so the resize
						  cursor doesn't hijack the hover (the "touching the border
						  shows resize while over the button" bug).
						- outline variant (not ghost + manual bg): in collapsed
						  state there's no title beside the button, so a borderless
						  ghost reads as "nothing". outline gives it a visible,
						  theme-aware chip + themed hover with zero manual color
						  overrides (Button variants now use semantic tokens).
						- centered (not ml-auto) so it isn't crammed off-edge in
						  the narrow icon-width rail.
					*/}
					<div className="hidden h-full items-center justify-center group-data-[collapsible=icon]:flex">
						<Button
							variant="outline"
							size="icon"
							className="relative z-30 h-8 w-8"
							onClick={onToggleSidebar}
							title="Expand sidebar"
						>
							<PanelLeftOpen className="size-4" />
						</Button>
					</div>


					{/* Search input — only visible when sidebar is expanded */}
					<div
						ref={searchContainerRef}
						className="hidden px-2 group-data-[collapsible=icon]:hidden"
					>
						<div className="relative">
							<Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search..."
								value={searchValue}
								onChange={(e) => setSearchValue(e.target.value)}
								className="h-7 w-full pl-8 text-xs"
							/>
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="group-data-[collapsible=icon]:sr-only">
							Navigation
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{mainNavItems.map((item) => (
									<SidebarMenuItem key={item.id}>
										<SidebarMenuButton
											asChild
											isActive={currentPath === item.path}
											tooltip={item.label}
										>
											<Link to={item.path}>
												<item.icon className="size-4" />
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter>
					<SidebarSeparator />
					<SidebarMenu>
						{bottomNavItems.map((item) => (
							<SidebarMenuItem key={item.id}>
								{item.path ? (
									<SidebarMenuButton
										asChild
										isActive={currentPath === item.path}
										tooltip={item.label}
									>
										<Link to={item.path}>
											<item.icon className="size-4" />
											<span>{item.label}</span>
										</Link>
									</SidebarMenuButton>
								) : (
									<SidebarMenuButton onClick={onKeybindings} tooltip={item.label}>
										<item.icon className="size-4" />
										<span>{item.label}</span>
									</SidebarMenuButton>
								)}
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarFooter>

				<SidebarRail />
			</Sidebar>
		);
	},
);
