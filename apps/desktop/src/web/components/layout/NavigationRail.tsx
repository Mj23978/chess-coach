/**
 * NavigationRail — left sidebar navigation for chess-coach.
 *
 * Uses the @repo/ui Sidebar components with a collapsible rail pattern.
 * Shows icons when collapsed, full labels when expanded.
 */
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
}

export function NavigationRail({ onKeybindings }: NavigationRailProps) {
	const location = useLocation();
	const currentPath = location.pathname;

	return (
		<Sidebar collapsible="icon" variant="sidebar">
			<SidebarHeader className="h-14 border-b border-sidebar-border">
				<div className="flex items-center gap-2 px-2">
					<span className="text-lg font-bold group-data-[collapsible=icon]:hidden">
						Chess Coach
					</span>
					<span className="hidden text-lg font-bold group-data-[collapsible=icon]:block">
						♚
					</span>
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
