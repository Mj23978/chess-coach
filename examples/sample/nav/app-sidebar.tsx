"use client"

import { Dispatch, SetStateAction, type ReactElement } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, useMotionValue, useSpring, useMotionTemplate, AnimatePresence } from "framer-motion"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/components/button"
import { Separator } from "@repo/ui/components/separator"
import { Progress } from "@repo/ui/components/progress"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@repo/ui/components/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"
import { ChevronLeft, ChevronRight, LogOut, MoreHorizontal, Moon, Settings as SettingsIcon, Sparkles, Sun, User as UserIcon } from "lucide-react"
import { BackendStatusIndicator } from "../components/backend-status-indicator"
import { useTheme } from "@repo/ui/providers/theme"
import { authClient } from "@repo/auth/client"
import { useSessionUser } from "@/layouts/session-context"

// --- Types ---

export interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
  description?: string
  badge?: string | number | "beta" | "new" | "pro"
  disabled?: boolean
  comingSoon?: boolean
  exact?: boolean // If true, matches path exactly. If false, matches if path starts with href.
  showSparkles?: boolean // Special active effect
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export interface AppSidebarProps {
  collapsed: boolean
  setCollapsed: Dispatch<SetStateAction<boolean>>

  // Navigation
  sections: NavSection[]
  bottomItems?: NavItem[]

  // Header / Top Area
  brand?: {
    name: string
    icon: ReactElement
    href: string
  }
  backLink?: {
    label: string
    href: string
  }
  contextCard?: {
    title: string
    subtitle?: string
    icon?: ReactElement
    progress?: number
    settingsHref?: string
  }

  // Footer / Bottom Area
  sidebarContent?: ReactElement
  footerContent?: ReactElement
}

// --- Main Component ---

export function AppSidebar({
  collapsed,
  setCollapsed,
  sections,
  bottomItems = [],
  brand,
  backLink,
  contextCard,
  sidebarContent,
  footerContent,
}: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={100}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 280 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-0 top-0 z-50 h-screen border-r border-border/40 bg-background/80 backdrop-blur-xl"
      >
        {/* Animated subtle background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex h-full flex-col relative">

          {/* --- TOP SECTION --- */}
          <div className="shrink-0">
            {/* Back Link Row (Project Style) */}
            {backLink && (
              <div className="flex h-14 items-center justify-between px-3 border-b border-border/40">
                <Link
                  href={backLink.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                    "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{backLink.label}</span>}
                </Link>

                {!collapsed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Options</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Brand Row (User Dashboard Style) */}
            {brand && !backLink && (
              <div className="flex h-14 items-center px-4 border-b border-border/40">
                <Link href={brand.href} className="flex items-center gap-3 overflow-hidden">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/10">
                    {brand.icon}
                  </div>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-sans text-sm font-bold tracking-tight text-foreground/90 truncate"
                    >
                      {brand.name}
                    </motion.span>
                  )}
                </Link>
              </div>
            )}

            {/* Context Card (e.g., Project Info) */}
            {contextCard && (
              <div className={cn("p-4 border-b border-border/40 transition-all", collapsed && "px-2 py-3")}>
                {!collapsed ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate text-foreground">
                          {contextCard.title}
                        </h3>
                        {contextCard.subtitle && (
                          <div className="flex items-center gap-2 mt-1">
                            {contextCard.icon && <div className="shrink-0">{contextCard.icon}</div>}
                            <span className="text-xs text-muted-foreground capitalize truncate">
                              {contextCard.subtitle}
                            </span>
                          </div>
                        )}
                      </div>
                      {contextCard.settingsHref && (
                        <Link href={contextCard.settingsHref}>
                          <SettingsIcon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors shrink-0" />
                        </Link>
                      )}
                    </div>
                    {contextCard.progress !== undefined && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{contextCard.progress}%</span>
                        </div>
                        <Progress value={contextCard.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {contextCard.icon || <span className="text-xs font-bold text-primary">{contextCard.title.charAt(0)}</span>}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-medium">{contextCard.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- MIDDLE SECTION (Scrollable Navigation) --- */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-4">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className="space-y-1">
                <AnimatePresence mode="wait">
                  {section.title && !collapsed && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest"
                    >
                      {section.title}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      item={item}
                      collapsed={collapsed}
                      currentPath={pathname || ""}
                    />
                  ))}
                </div>
              </div>
            ))}

            {sidebarContent && (
              <div className={cn("mt-4", collapsed ? "hidden" : "block")}>
                <div className="rounded-xl border border-border/40 bg-muted/30 p-3 text-xs">
                  {sidebarContent}
                </div>
              </div>
            )}
          </nav>

          {/* --- BOTTOM SECTION (Footer & User) --- */}
          <div className="shrink-0 p-1 space-y-2 border-t border-border/40 bg-muted/10">
            {footerContent && !collapsed && (
              <div className="rounded-xl border border-border/40 bg-muted/30 p-3 text-xs mb-2">
                {footerContent}
              </div>
            )}



            {bottomItems.length > 0 && (
              <div className="space-y-0.5">
                {bottomItems.map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    collapsed={collapsed}
                    currentPath={pathname || ""}
                  />
                ))}
              </div>
            )}

            {/* Separator if there are bottom items and the user menu */}
            {bottomItems.length > 0 && !collapsed && (
              <Separator className="my-2 bg-border/40" />
            )}

            {/* User menu (compact dropdown: profile / settings / theme / sign out) */}
            <SidebarUserMenu collapsed={collapsed} />
          </div>
        </div>

        {/* Hover-active Edge Collapse Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute top-8 -right-3 h-6 w-6 rounded-full border border-border bg-background shadow-md transition-transform hover:scale-110 hover:bg-muted z-50",
            collapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </motion.aside>
    </TooltipProvider>
  )
}

// --- Nav Item Component ---

interface SidebarNavItemProps {
  item: NavItem
  collapsed: boolean
  currentPath: string
}

function SidebarNavItem({ item, collapsed, currentPath }: SidebarNavItemProps) {
  // Check active state safely
  const isActive = item.exact
    ? currentPath === item.href
    : currentPath === item.href || currentPath.startsWith(item.href + "/")

  // Mouse hover spotlight effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const mouseXSpring = useSpring(mouseX, { stiffness: 450, damping: 25 })
  const mouseYSpring = useSpring(mouseY, { stiffness: 450, damping: 25 })
  const background = useMotionTemplate`radial-gradient(110px circle at ${mouseXSpring}px ${mouseYSpring}px, var(--muted) 0%, transparent 80%)`

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  function handleMouseLeave() {
    mouseX.set(-999)
    mouseY.set(-999)
  }

  const Icon = item.icon

  const innerContent = (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 overflow-hidden",
        isActive
          ? "text-primary-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground",
        (item.disabled || item.comingSoon) && "opacity-50 pointer-events-none cursor-not-allowed"
      )}
    >
      {/* Spotlight highlight on hover */}
      {!isActive && (
        <motion.div
          className="absolute inset-0 -z-10 opacity-60 transition-opacity group-hover:opacity-100 pointer-events-none"
          style={{ background }}
        />
      )}

      {/* Active layout pill */}
      {isActive && (
        <motion.div
          layoutId="app-sidebar-active-pill"
          className="absolute inset-0 -z-10 rounded-lg bg-primary shadow-sm shadow-primary/20"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {/* Icon */}
      <Icon className={cn(
        "h-4.5 w-4.5 shrink-0 transition-transform duration-200",
        isActive ? "text-primary-foreground" : "text-muted-foreground/75 group-hover:text-foreground group-hover:scale-105"
      )} />

      {/* Text & Labels (Expanded Only) */}
      {!collapsed && (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="truncate"
          >
            {item.label}
          </motion.span>

          {item.badge && (
            <span className={cn(
              "px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wide uppercase ml-auto shrink-0",
              item.badge === "pro" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                item.badge === "beta" ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" :
                  item.badge === "new" ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {item.badge}
            </span>
          )}

          {item.comingSoon && (
            <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wide uppercase bg-muted text-muted-foreground ml-auto shrink-0">
              Soon
            </span>
          )}
        </div>
      )}

      {/* Special Sparkles effect on Active (e.g. for AI generation items) */}
      {isActive && !collapsed && item.showSparkles && (
        <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0 ml-auto">
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground/80" />
        </motion.div>
      )}
    </div>
  )

  const linkWrapper = item.comingSoon || item.disabled ? (
    <div className="px-1">{innerContent}</div>
  ) : (
    <Link href={item.href} className="px-1 block">
      {innerContent}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkWrapper}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="text-xs">
          <p className="font-medium">{item.label}</p>
          {item.description && <p className="text-muted-foreground mb-1">{item.description}</p>}
          {item.comingSoon && <p className="text-muted-foreground italic">Coming soon</p>}
        </TooltipContent>
      </Tooltip>
    )
  }

  return linkWrapper
}

// --- User Menu (compact dropdown) ---

/**
 * Compact account button that lives at the bottom of the sidebar.
 *
 * Replaces the old two-row footer (avatar + name/email row + a separate
 * full-width "Sign Out" button). The trigger shows just the avatar +, when
 * expanded, the user's name and a chevron — clicking opens a dropdown with
 * Profile / Settings / Theme (Light/Dark/System) / Sign Out. Full name+email
 * detail lives inside the dropdown header, not on the sidebar chrome, so the
 * footer consumes one row instead of two.
 *
 * Works in collapsed mode too: the trigger shrinks to the avatar alone and the
 * menu floats out to the right (`side="right"`).
 *
 * The signed-in user is read from `useSessionUser()` (populated by
 * `<RequireAuth>`), not from props — so every page that renders `<UserLayout>`
 * automatically shows the real user without wiring.
 */
function SidebarUserMenu({ collapsed }: { collapsed: boolean }) {
  const user = useSessionUser()
  const { push } = useRouter()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/sign-in"
        },
      },
    })
  }

  const name = user?.name || "User"
  const email = user?.email || undefined
  const avatar = user?.image || undefined
  const initial = (user?.name?.charAt(0) || "U").toUpperCase()

  // Avatar element reused in the trigger and the dropdown header.
  const Avatar = ({ size = "md" }: { size?: "sm" | "md" }) => (
    avatar ? (
      <img
        src={avatar}
        alt={name}
        className={cn(
          "shrink-0 rounded-full object-cover border border-border/60 shadow-sm",
          size === "sm" ? "h-8 w-8" : "h-9 w-9"
        )}
      />
    ) : (
      <div
        className={cn(
          "shrink-0 flex items-center justify-center rounded-full bg-primary/10 font-medium text-primary",
          size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm"
        )}
      >
        {initial}
      </div>
    )
  )

  return (
    <DropdownMenu >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
            "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed && "justify-center px-0"
          )}
        >
          <Avatar />
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground/90 leading-none">
                {name}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={"right"}
        align="end"        
        sideOffset={collapsed ? 12 : -12}
        className="w-64 -translate-y-10"
      >
        {/* Header: full identity lives here, not on the sidebar chrome */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 px-1 py-1">
            <Avatar size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">
                {name}
              </p>
              {email && (
                <p className="truncate text-xs leading-tight text-muted-foreground">
                  {email}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer gap-2.5"
          onClick={() => push("/profile")}
        >
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5"
          onClick={() => push("/settings")}
        >
          <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>

        {/* Theme submenu — Light / Dark / System */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer gap-2.5">
            <Sun className="h-4 w-4 text-muted-foreground dark:hidden" />
            <Moon className="hidden h-4 w-4 text-muted-foreground dark:inline" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={setTheme}
            >
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}