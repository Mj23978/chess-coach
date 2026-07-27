/**
 * NavigationRail — left sidebar navigation for chess-coach.
 *
 * Uses the @repo/ui Sidebar components with a collapsible rail pattern.
 * Shows icons when collapsed, full labels when expanded.
 *
 * Includes a search input in the header (moved from the removed TitleBar)
 * and a sidebar collapse toggle.
 */
import { useState } from "react";
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

export function NavigationRail({ onKeybindings, onToggleSidebar }: NavigationRailProps) {
	const location = useLocation();
	const currentPath = location.pathname;
	const [searchValue, setSearchValue] = useState("");

	return (
		<Sidebar collapsible="icon" variant="sidebar">
			<SidebarHeader className="h-14 border-b border-sidebar-border">
				<div className="flex items-center gap-2 px-2">
					{/* App title (hidden when collapsed) */}
					<span className="text-lg font-bold group-data-[collapsible=icon]:hidden">
						Chess Coach
					</span>
					<span className="hidden text-lg font-bold group-data-[collapsible=icon]:block">
						♚
					</span>

					{/* Collapse toggle — visible when expanded */}
					<Button
						variant="ghost"
						size="icon"
						className="ml-auto h-7 w-7 group-data-[collapsible=icon]:hidden"
						onClick={onToggleSidebar}
						title="Collapse sidebar"
					>
						<PanelLeftClose className="size-4" />
					</Button>

					{/* Expand toggle — visible when collapsed */}
					<Button
						variant="ghost"
						size="icon"
						className="hidden h-7 w-7 group-data-[collapsible=icon]:block"
						onClick={onToggleSidebar}
						title="Expand sidebar"
					>
						<PanelLeftOpen className="size-4" />
					</Button>
				</div>

				{/* Search input — only visible when sidebar is expanded */}
				<div className="hidden px-2 group-data-[collapsible=icon]:hidden">
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
}
