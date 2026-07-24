"use client"

import * as React from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

export interface EntityPageBackLink {
  /** Back-link label (e.g. "Back to Cast & Voices"). */
  label: string
  /** Destination href. */
  href: string
  /**
   * Optional component used to render the link. Defaults to a plain `<a>`.
   * Pass react-router's `Link` (or the next-intl `Link`) from the host app for
   * client-side navigation. Kept as a prop so this package stays router-agnostic.
   */
  as?: React.ElementType
}

export interface EntityPageHeaderProps {
  /** Page title (Newsreader serif). */
  title: string
  /** Supporting description rendered below the title in muted text. */
  description?: string
  /** Back link — renders a breadcrumb-style back button above the title. */
  backLink?: EntityPageBackLink
  /** Status badge node (e.g. <StatusBadge/>). Renders to the right of the title. */
  badge?: React.ReactNode
  /** Right-aligned action buttons. */
  actions?: React.ReactNode
  /** Optional icon/illustration on the left. */
  icon?: React.ReactNode
  className?: string
}

/**
 * Consistent header for entity detail pages (character, voice, idea, script,
 * asset, project settings). Renders a subtle back link, a Newsreader-serif
 * title with an optional icon and badge, a muted description, and right-aligned
 * actions — over a surface-toned strip with a bottom border separator.
 *
 * Router-agnostic: `backLink.as` lets the host pass its own `<Link>` (react-router
 * in the desktop SPA, next-intl in the web app). Defaults to a plain `<a>`.
 */
export function EntityPageHeader({
  title,
  description,
  backLink,
  badge,
  actions,
  icon,
  className,
}: EntityPageHeaderProps) {
  const BackLinkComponent = backLink?.as ?? "a"
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-card/60 px-5 py-5 sm:px-6 sm:py-6",
        className
      )}
    >
      {backLink && (
        <BackLinkComponent
          // `to` is for react-router Link; `href` is for a plain <a>. Both pass
          // harmlessly to the other element type.
          to={backLink.href}
          href={backLink.href}
          className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          {backLink.label}
        </BackLinkComponent>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                className="font-serif text-2xl sm:text-3xl font-semibold text-foreground leading-tight tracking-tight"
                style={{ fontFamily: "var(--font-serif, Newsreader, Georgia, serif)" }}
              >
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
