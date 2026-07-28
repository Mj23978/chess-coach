---
name: Chess Coach
description: A lightweight, hand-annotated desktop chess coach — cream paper, sage ink, terracotta marginalia.
colors:
  # Surfaces (light)
  cream-paper: "#fcf9f4"
  charcoal-ink: "#1c1c19"
  card-white: "#ffffff"
  parchment-sidebar: "#eae5dc"
  # Primary — Sage
  sage: "#496458"
  sage-foreground: "#ffffff"
  sage-mist: "#a7c4b5"
  sage-mist-ink: "#385246"
  # Secondary — Slate
  slate: "#596060"
  slate-foreground: "#ffffff"
  slate-wash: "#dae1e1"
  # Tertiary — Terracotta
  terracotta: "#8b4c50"
  terracotta-foreground: "#ffffff"
  terracotta-blush: "#f8a8ab"
  # Muted / accent
  muted-surface: "#f0ede9"
  muted-foreground: "#424844"
  # Semantic
  success: "#496458"
  warning: "#8b4c50"
  destructive: "#ba1a1a"
  destructive-wash: "#ffdad6"
  # Lines
  hairline: "#c2c8c3"
  input-trough: "#e5e2dd"
  focus-ring: "#496458"
  # Chess
  chess-cream: "#f5f0e8"
  chess-brown: "#5c4033"
  chess-green: "#3a5a40"
  chess-gold: "#b8860b"
  board-light: "#f0d9b5"
  chart-1: "#496458"
  chart-2: "#5d7a6c"
  chart-3: "#728f81"
  chart-4: "#a7c4b5"
  chart-5: "#c1d8cc"
typography:
  display:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontWeight: 500
  headline-lg:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "48px"
    fontWeight: 500
    lineHeight: 1.2
  headline-md:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.3
  headline-sm:
    fontFamily: "Newsreader, ui-serif, Georgia, serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label-md:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace"
rounded:
  sm: "0.15rem"
  md: "0.3rem"
  card: "0.55rem"
  lg: "0.8rem"
  xl: "1.2rem"
  pill: "9999px"
spacing:
  unit: "8px"
  gutter: "24px"
  section: "120px"
components:
  button-primary:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.sage-foreground}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.sage-mist-ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.md}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.md}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  button-pill:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.sage-foreground}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
  paper-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  paper-card-hover:
    backgroundColor: "{colors.card-white}"
  featured-card:
    backgroundColor: "{colors.sage-mist}"
    textColor: "{colors.sage-mist-ink}"
    rounded: "{rounded.card}"
    padding: "2rem"
  input-default:
    backgroundColor: "{colors.cream-paper}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  sidebar-button:
    backgroundColor: "transparent"
    textColor: "{colors.parchment-sidebar}"
    rounded: "{rounded.md}"
    padding: "0.5rem"
---

# Design System: Chess Coach

## Overview

**Creative North Star: "The Annotated Scorebook"**

Chess Coach is a quiet study tool, not a flashy game UI. It reads like a thoughtful chess journal — cream paper, sage-green ink, and the occasional terracotta note in the margin. The board is the centerpiece; the interface around it recedes. Every surface should feel like something you'd be comfortable sitting with for an hour of post-game review.

The palette is warm and restrained. Sage green (`#496458`) is the single committed accent — it carries every primary action, every success state, every active sidebar item, and the board's own move highlights. Terracotta (`#8b4c50`) is the marginalia: it marks warnings, tertiary emphasis, and the rare accent that isn't sage. The cream paper (`#fcf9f4`) and warm parchment sidebar (`#eae5dc`) hold everything. Nothing is pure white except cards sitting on the cream page; nothing is pure gray.

Typography pairs **Newsreader** (a warm transitional serif) for headlines with **Hanken Grotesk** (a friendly humanist sans) for body and labels. The serif headlines give the app its "worth reading closely" character; the sans body keeps dense move lists and PGN scannable. Decorative utilities — `sketch-underline`, `sketch-border`, `paper-texture`, `organic-blob` — are used sparingly to reinforce the hand-annotated feel: a slightly off-kilter underline under a section title, a fractal-noise paper grain on hero surfaces, an organic blob behind a feature card. They are accent, never structure.

**Key Characteristics:**
- Warm cream paper background, never neutral gray; pure white only for elevated cards
- Sage green as the single committed accent (primary, success, focus ring, board highlights)
- Terracotta as marginalia only — warnings, tertiary emphasis, the rare non-sage accent
- Newsreader serif headlines + Hanken Grotesk body; labels are uppercase, tracked, sans
- Hand-annotated decorative utilities (`sketch-*`, `paper-texture`, `organic-blob`) as accent, not structure
- Full dark mode where surfaces shift to charcoal and sage lightens to mist; same identity, inverted values
- Restraint: the board commands attention, chrome recedes

## Colors

The palette is three committed hues (sage, terracotta, charcoal) on warm cream paper, with a full tonal inversion for dark mode. Sage is dominant; terracotta is rare; everything else is paper and ink.

### Primary — Sage

- **Sage** (`#496458`): The single committed accent. Used for every primary action, focus ring, success state, active sidebar item, board move highlights, and the `--ring` token. Its rarity outside of action surfaces is the point — when sage appears, it means "this is the thing to do or notice."
- **Sage Mist** (`#a7c4b5`): The tonal container for sage. Backgrounds that need to feel "on brand" without the saturation of the primary — featured cards, accent surfaces, the chess `--color-chess-sage` alias. In dark mode it lightens to `#b0cdbe`.
- **Sage Mist Ink** (`#385246`): Foreground text on sage-mist surfaces.

### Secondary — Slate

- **Slate** (`#596060`): The neutral-but-warm secondary. Used for secondary buttons and less-prominent affordances. Deliberately cool-leaning against the warm paper to create quiet contrast without introducing a new hue family.

### Tertiary — Terracotta

- **Terracotta** (`#8b4c50`): Marginalia. Warnings, tertiary emphasis, the rare accent that isn't sage. In dark mode it lightens to `#ffb3b5`. **Use sparingly** — terracotta and sage competing on one surface breaks the system.

### Neutral — Paper & Ink

- **Cream Paper** (`#fcf9f4`): Page background. Warm, never neutral gray. The `--background` token.
- **Card White** (`#ffffff`): Elevated card surfaces sitting on the cream page. The only pure white in the system.
- **Parchment** (`#eae5dc`): The sidebar's warm parchment. Slightly darker and more yellow than the page to read as a distinct panel without leaving the paper family.
- **Charcoal Ink** (`#1c1c19`): Body text. A warm near-black, never `#000`.
- **Muted Surface** (`#f0ede9`): Subtle container backgrounds (`--muted`).
- **Muted Foreground** (`#424844`): Secondary text, metadata, captions.
- **Hairline** (`#c2c8c3`): Borders and dividers (`--border`).

### Semantic States

- **Success** = Sage (`#496458`) — same as primary; success is the default positive, no separate green.
- **Warning** = Terracotta (`#8b4c50`) — same as tertiary.
- **Destructive** (`#ba1a1a`): The one true red, reserved for irreversible actions and errors only.

### Chess Board

- **Board Light** (`#f0d9b5`): The classic lichess brown-theme light square. Not part of the UI palette — the board is its own surface with its own (intentionally retro) rules.
- **Chess Cream** (`#f5f0e8`), **Chess Brown** (`#5c4033`), **Chess Green** (`#3a5a40`), **Chess Gold** (`#b8860b`): Semantic chess aliases available for chess-specific UI (eval bars, piece sets, opening badges).

### Dark Mode

Dark mode is a full tonal inversion, not a separate palette. Charcoal (`#1c1c19`) becomes the paper; cream becomes the ink (`#e5e2dd`); sage lightens to mist (`#b0cdbe`); terracotta lightens to blush (`#ffb3b5`). Cards shift to `#31302d`. The identity is identical — only the values flip. See the sidecar tonal ramps for the full inversion table.

### Named Rules

**The One Accent Rule.** Sage is the primary accent for the entire system — buttons, focus, success, sidebar active, board highlights all draw from the same `#496458`. Do not introduce a second "action" hue. Terracotta is marginalia, not a competing action color.

**The Warm Paper Rule.** Backgrounds are warm. `#fcf9f4` cream, `#eae5dc` parchment, `#ffffff` only for cards elevated above the cream. Never use neutral gray (`neutral-*`, `gray-*`, `slate-*` Tailwind defaults) for backgrounds or text — they read as cold and break the paper metaphor. (See Do's and Don'ts for the canonical-component corollary.)

## Typography

**Display Font:** Newsreader (with `ui-serif, Georgia, serif` fallback)
**Body Font:** Hanken Grotesk (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Mono Font:** `ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace`

**Character:** A warm transitional serif paired with a friendly humanist sans. Newsreader gives headlines the "this is worth reading closely" editorial weight; Hanken Grotesk keeps move lists, PGN, and UI labels legible at small sizes. The pairing is the typographic expression of the Annotated Scorebook — a considered publication, not a game console.

> ⚠️ **Implementation gap.** Newsreader and Hanken Grotesk are declared in `--font-sans` / `--font-serif` but **no `@font-face` or Google Fonts link is loaded anywhere** (`index.html` ships only a title + script). In practice the app renders with the fallbacks (`system-ui` body, `Georgia` display). Loading the committed fonts is required to realize this system. See Do's and Don'ts.

### Hierarchy

- **Display** (Newsreader, ~72px, weight 500, line-height 1.1, tracking -0.02em): Hero headlines only. The largest, rarest type — used once per view at most.
- **Headline Lg** (Newsreader, 48px, 500, 1.2): Page titles and major section headers.
- **Headline Md** (Newsreader, 32px, 500, 1.3): Section headers within a page.
- **Headline Sm** (Newsreader, 24px, 600, 1.4): Subsection headers, card titles.
- **Body Lg** (Hanken Grotesk, 18px, 400, 1.6): Lead paragraphs, descriptive copy. Cap line length at ~65–75ch.
- **Body Md** (Hanken Grotesk, 16px, 400, 1.6): Default body, move lists, PGN, table cells.
- **Label Md** (Hanken Grotesk, 14px, 600, 1.2, tracking 0.05em, uppercase): Eyebrows, nav labels, table headers, metadata tags. The uppercase tracked label is the system's way of saying "this is structural, not prose."

### Named Rules

**The Serif-For-Meaning Rule.** Newsreader (serif) is reserved for headlines and display — moments where the app is making a statement. Body, labels, inputs, and tables are always Hanken Grotesk (sans). Do not set body copy in the serif; do not set headlines in the sans.

**The Uppercase-Label Rule.** Structural labels (eyebrows, nav, table headers, status tags) are uppercase, tracked `0.05em`, weight 600, sans. Prose metadata (timestamps, descriptions) stays sentence-case. The case signals structure vs. content.

## Layout

The app shell is a fixed full-viewport flex column: a 24px window-drag region at top (Electrobun provides native chrome), then a `SidebarProvider` row with the navigation rail on the left and a single scrollable `SidebarInset` for content on the right. There is no centered container max-width on the main content by default — the content fills the window, which is the desktop-app expectation.

- **Navigation rail:** `16rem` (256px) expanded, `3rem` (48px) collapsed to icon-only, `18rem` (288px) on mobile. Collapsible via a resize rail (`collapsible="icon"`). Header is `h-14` (56px) with a bottom border.
- **Content gutter:** `24px` left/right padding via the `.content-gutter` utility when a page wants internal rhythm. Section spacing is generous: `.section-gap` is `120px` top/bottom for hero-style pages.
- **Container utility:** `.container` is `max-width: 1280px; margin-inline: auto; padding-inline: 2rem` — available but not applied globally; use it when a page (settings, forms) benefits from a centered measure.
- **Board region:** The chessboard container is `aspect-ratio: 1 / 1; width: 100%` and is the visual anchor of any board page. Surrounding panels (eval bar, move list, controls) defer to it.

**Density:** Comfortable, leaning airy. The casual-player audience (per PRODUCT.md) means we err on the side of breathing room over information density. Tables and move lists can tighten; primary surfaces stay generous.

### Breakpoints

Tailwind defaults (`sm 640`, `md 768`, `lg 1024`, `xl 1280`) plus a custom `2xl: 1400px`. The sidebar switches to its mobile (18rem overlay) behavior below `md` (768px). Note: the desktop app runs in an Electrobun webview, so most users are at desktop widths; mobile breakpoints matter mainly for narrow windows.

## Elevation & Depth

The system uses **soft, warm shadows at low alpha**, never hard drop shadows or heavy elevation. Depth is conveyed by shadow + the paper/card tonal step, not by strong light.

### Shadow Vocabulary

All shadows use `hsl(28 28 25 / <alpha>)` — the shadow color is derived from the warm charcoal ink (`#1c1c19` ≈ `hsl(28 28 25)`), so even shadows are warm, never neutral gray.

- **2xs** (`0 1px 2px hsl(28 28 25 / 0.04)`): The barest separation — hairline-equivalent depth for tight UI.
- **xs** (`0 2px 4px hsl(28 28 25 / 0.06)`): Resting cards, inputs.
- **sm** (`0 2px 4px …/0.06, 0 1px 2px …/0.04`): Default card shadow; the `.paper-card` resting state.
- **md** (`0 4px 8px …/0.06, 0 2px 4px …/0.04`): Hover state for cards (`.paper-card:hover`).
- **lg** (`0 8px 16px …/0.06, 0 4px 8px …/0.04`): Popovers, dropdowns.
- **xl** (`0 12px 24px …/0.08, 0 6px 12px …/0.04`): Dialogs, modals.
- **2xl** (`0 16px 32px …/0.10, 0 8px 16px …/0.06`): Reserved; the top of the scale.

### Named Rules

**The Warm-Shadow Rule.** Every shadow uses the warm charcoal ink color (`hsl(28 28 25 / α)`), never neutral black or default Tailwind `shadow-*` (which use `0 0%` / gray). A cold shadow on a warm surface breaks the paper metaphor instantly.

**The Shadow-For-State Rule.** Cards rest at `sm`; they lift to `md` and translate `y: -2px` on hover. Shadows respond to interaction state — they are not decorative resting elevation. Dialogs and popovers are the only surfaces licensed for `lg`/`xl` at rest.

## Shapes

The form language is **soft and slightly rounded**, with two intentional departures: the fully-round pill (for primary CTAs and tags) and the hand-drawn wobble (for decorative accents).

- **Default corner:** `0.3rem` (`--radius` / md) — buttons, inputs, sidebar items. A gentle, modern softness.
- **Cards:** `0.55rem` (`--radius-md`, aliased `card` here) — `.paper-card`, `.featured-card`. Slightly more generous than buttons.
- **Larger surfaces:** `0.8rem` (lg) for input containers, `1.2rem` (xl) / `1.5rem` (2xl) for large panels.
- **Pill:** `9999px` (`--radius-full`) — `.btn-pill`, tags, status chips. The pill is the system's "this is a primary CTA or a label" signal.
- **Sketch border:** `255px 15px 225px 15px / 15px 225px 15px 255px` (`.sketch-border`) — a hand-drawn wobble, used decoratively on at most one element per view to reinforce the annotated-scorebook feel. Never on structural chrome.

Borders are `1px` hairlines in `--border` (`#c2c8c3` light / `#424844` dark). Inputs use a `2px` border (`border-2`) to read as fields rather than containers.

## Components

### Buttons

- **Shape:** `rounded-md` (0.3rem); `.btn-pill` variant uses `rounded-full`.
- **Primary:** Sage (`--primary` `#496458`) background, white foreground, `h-10 px-4`. Hover darkens toward sage-mist-ink. This is the single committed action style.
- **Outline / Ghost:** Transparent background, charcoal ink text, `1px` border (outline) or no border (ghost). Hover fills subtle. Used for secondary and tertiary actions.
- **Destructive:** Destructive red (`#ba1a1a`), white text. Irreversible actions only — never for "cancel."
- **Pill (`.btn-pill`):** Sage, white text, fully round, wider horizontal padding (`1.5rem`). The signature CTA shape for hero actions. Optionally pairs with `.btn-arrow` (an animated `→` glyph on hover).
- **Sizes:** default `h-10`; sm `h-8 text-xs`; lg `h-12 text-base`; icon `size-10`.
- **Focus:** `ring-2 ring-ring` (sage) with a `ring-primary/10` halo on inputs/buttons. Never outline-only.
- **Hover/active:** `transition-colors` (~200ms); primary lifts shadow on `.paper-card` companions, buttons shift background one step.

> ⚠️ **Known drift.** The generic `@repo/ui` Button currently ships shadcn defaults (`bg-neutral-900`, `border-neutral-300`, `focus-visible:ring-neutral-400`) — hardcoded neutral grays that bypass the sage theme entirely. The canonical button is the theme-token-driven variant described above. See Do's and Don'ts for the migration rule.

### Cards

- **Paper Card (`.paper-card`):** White (`--card`) on the cream page, `1px` hairline border (`--border`), `rounded` 0.55rem, `--shadow-sm` at rest, lifts to `--shadow-md` + `translateY(-2px)` on hover (200ms ease). The default container for grouped content.
- **Featured Card (`.featured-card`):** Sage-mist (`--primary-container`) background, sage-mist-ink text, `2px` sage border, 0.55rem radius, `2rem` padding. For the one emphasized card in a grid — the "start here" or featured game.
- **Internal padding:** `1.5rem` default (`.paper-card`); `2rem` for featured.
- **Header/Title:** Headline Sm (Newsreader 24px/600) for card titles; Label Md (sans uppercase tracked) for eyebrows above.

> ⚠️ **Known drift.** The generic `@repo/ui` Card ships `rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-sm` — neutral-200/neutral-900 hardcoded. The canonical card is `.paper-card` / `.featured-card`. Same migration rule as buttons.

### Inputs

- **Default:** Cream background (`--background`), `2px` `--input` border, `rounded-lg` (0.8rem), `h-10 px-4`. Focus: border shifts to sage (`--primary`) + `ring-4 ring-primary/10` halo. Error (`aria-invalid`): destructive border + `ring-destructive/10`.
- **Minimal:** `1px` border, `ring-2 ring-primary/20` on focus — for dense forms.
- **Underline:** Bottom-border only (`border-b-2`), no radius, no focus ring — for search and inline filters.
- **Filled:** Rounded with a tonal fill — ⚠️ the `bg-surface-container` / `bg-surface-container-high` classes referenced here are **not defined** in the theme; this variant is currently broken and should be repointed to `--muted` / `--card` until the tokens exist.

### Navigation Rail / Sidebar

- **Shell:** Warm parchment (`--sidebar-background` `#eae5dc` light / `#31302d` dark), charcoal ink text. `h-14` (56px) header with a hairline bottom border.
- **Menu buttons:** `rounded-md p-2 text-sm`, transparent at rest. Hover and active fill with `--sidebar-accent` (sage mist) and `--sidebar-accent-foreground` text. `data-[active=true]` holds the accent. Collapsed mode shrinks to `size-8` icon-only.
- **Rail resize:** A `w-4` (16px) drag handle on the inner edge; `hover:after:bg-sidebar-border` reveals the affordance.
- **Widths:** 256px expanded / 48px collapsed / 288px mobile.
- **Typography:** Label Md (sans uppercase tracked) is too loud for nav items — nav uses sentence-case Hanken Grotesk `text-sm`. Reserve uppercase labels for eyebrows and table headers, not navigation.

### Dialog / Modal

- **Overlay:** `fixed inset-0 z-50 bg-black/50`, fade in/out (200ms).
- **Content:** `--background` surface, centered via `translate(-50%, -50%)`, `rounded-lg`, `1px` `--border`, `--shadow-lg`, `p-6`, `max-w-lg` (`sm:max-w-lg`, `max-w-[calc(100%-2rem)]` on narrow screens). Open: `fade-in-0 zoom-in-95`; close: reverse.
- **Title:** Headline Sm (Newsreader 24px/600) — or `text-lg font-semibold` via DialogTitle; prefer the serif for modal titles to keep the editorial voice.
- **Close affordance:** Top-right `size-4` icon, `rounded-xs`, `opacity-70` → `1` on hover.

### Chess Board (Signature Component)

The board is the product's centerpiece and follows its own rules — it is intentionally retro (lichess brown theme) rather than on-brand.

- **Container:** `aspect-ratio: 1 / 1; width: 100%`. The board fills its column and commands the visual hierarchy of any board page.
- **Themes:** brown (default, light `#f0d9b5` + SVG-patterned dark squares), blue, green, purple. Brown is the default and the only one that ships the classic lichess look; the others use `repeating-conic-gradient`.
- **Highlights:** last-move `rgba(155,199,0,0.41)` (yellow-green), selected `rgba(20,85,30,0.5)` (green), move-dest dot `#208530`, check `rgba(255,0,0,1)→transparent`. These are chessground's standard signals and should not be restyled to match the sage palette — recognition matters more than brand consistency on the board itself.
- **Pieces:** cburnett set (chessground default).

### Decorative Utilities (Signature)

Used sparingly — at most one or two per view — to reinforce the Annotated Scorebook character. They are accent, never structural.

- **`.sketch-underline`:** A 2px `currentColor` bar under inline text, `border-radius: 50%`, rotated `-1deg`, `opacity 0.7` (0.5 dark). For emphasizing a word or short phrase in prose. Animates in (`sketch-underline` keyframe, 0.6s).
- **`.sketch-border`:** The hand-drawn wobble radius (`255px 15px 225px 15px / 15px 225px 15px 255px`). For one decorative container per view — a callout, a feature card.
- **`.paper-texture`:** An SVG fractal-noise (`baseFrequency 0.9`) `::before` overlay at `opacity 0.4` (0.2 dark). For hero/landing surfaces only; never on working UI.
- **`.organic-blob`:** `border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%`. A background shape behind feature content; pairs with `organic-float` animation (3s ease-in-out).
- **`.sketch-star` / `.sketch-arrow`:** `✦` / `→` glyph decorations via `::before` / `::after`.

## Do's and Don'ts

### Do:

- **Do** use sage (`#496458` / `--primary`) for every primary action, focus ring, success state, and active sidebar item. Sage is the one accent.
- **Do** keep backgrounds warm: cream paper (`#fcf9f4`), parchment sidebar (`#eae5dc`), pure white only for cards elevated above the cream.
- **Do** pair Newsreader (serif) for headlines with Hanken Grotesk (sans) for body — and load the fonts (see the implementation gap above; add a Google Fonts import or self-host).
- **Do** use the warm shadow tokens (`--shadow-*`, all `hsl(28 28 25 / α)`); cards rest at `sm`, lift to `md` + `translateY(-2px)` on hover.
- **Do** reserve uppercase tracked Label Md for structural labels (eyebrows, nav, table headers, status tags); keep prose metadata sentence-case.
- **Do** use decorative utilities (`sketch-underline`, `paper-texture`, `organic-blob`) sparingly — one or two per view — to reinforce the annotated-scorebook feel.
- **Do** let the chess board command its page; surrounding panels (eval bar, move list) defer to it.

### Don't:

- **Don't** use Tailwind `neutral-*`, `gray-*`, or `slate-*` defaults for backgrounds, text, borders, or shadows — they are cold and break the warm-paper metaphor. This is the single most common way the system gets broken.
- **Don't** introduce a second action hue. Terracotta is marginalia (warnings, tertiary emphasis), not a competing button color.
- **Don't** set body copy in Newsreader or headlines in Hanken Grotesk. The serif/sans split is load-bearing.
- **Don't** restyle the chessboard highlights to match the sage palette — the lichess-standard signals (yellow-green last-move, green selected, red check) are recognition-critical and must stay.
- **Don't** use `shadow-xl`/`shadow-2xl` at rest outside dialogs and popovers. Heavy elevation is reserved for overlays.
- **Don't** apply `paper-texture` or `organic-blob` to working UI (forms, tables, controls) — they are hero/landing decoration only.

### Migration rule (canonical components)

The generic `@repo/ui` Button, Card, and Input currently ship shadcn defaults with hardcoded `neutral-*` colors (`bg-neutral-900`, `border-neutral-300`, `text-neutral-900`, `ring-neutral-400`, etc.). These bypass the sage theme entirely. **The canonical components are the theme-token-driven variants** (`.paper-card`, `.featured-card`, `.btn-pill`, and the sage-token buttons/inputs described above).

The fix is **token-level, not per-component**: either (a) remap `neutral-*` to the warm palette by adding `--color-neutral-*` → sage/paper/ink mappings in the `@theme` block of `packages/ui/styles/globals.css`, or (b) repoint the component classes from `neutral-*` to `primary` / `card` / `border` tokens. Either way, a `globals.css` change alone should realign every shadcn component — **do not rewrite component source files one by one.** New components must consume theme tokens (`bg-primary`, `bg-card`, `text-foreground`, `border-border`, `ring-ring`) from day one; never hardcode `neutral-*`.
