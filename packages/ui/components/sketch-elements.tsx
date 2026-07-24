import * as React from "react"
import { cn } from "@repo/ui/lib/utils"

// === Sketch Underline ===
interface SketchUnderlineProps extends React.ComponentProps<"span"> {
	offset?: number
	thickness?: number
	wobble?: number
}

function SketchUnderline({
	className,
	offset = 2,
	thickness = 2,
	wobble = 0.02,
	children,
	...props
}: SketchUnderlineProps) {
	return (
		<span
			data-slot="sketch-underline"
			className={cn("relative inline", className)}
			{...props}
		>
			{children}
			<span
				className="absolute left-0 right-0 bottom-0 h-[2px] bg-current opacity-70"
				style={{
					transform: `rotate(${-1 + Math.random() * 2}deg)`,
					borderRadius: "50%",
					marginBottom: `-${offset}px`,
				}}
				aria-hidden="true"
			/>
		</span>
	)
}

// === Sketch Arrow ===
interface SketchArrowProps extends React.ComponentProps<"span"> {
	direction?: "left" | "right" | "up" | "down"
	size?: number
}

function SketchArrow({
	className,
	direction = "right",
	size = 24,
	children,
	...props
}: SketchArrowProps) {
	const arrows = {
		left: "←",
		right: "→",
		up: "↑",
		down: "↓",
	}

	return (
		<span
			data-slot="sketch-arrow"
			data-direction={direction}
			className={cn(
				"inline-flex items-center justify-center font-display opacity-70",
				className
			)}
			style={{ fontSize: `${size}px` }}
			{...props}
		>
			{children || arrows[direction]}
		</span>
	)
}

// === Sketch Star/Accent ===
interface SketchStarProps extends React.ComponentProps<"span"> {
	variant?: "star" | "sparkle" | "dot" | "circle"
	size?: number
	color?: string
}

function SketchStar({
	className,
	variant = "star",
	size = 16,
	color = "currentColor",
	...props
}: SketchStarProps) {
	const symbols = {
		star: "✦",
		sparkle: "✨",
		dot: "•",
		circle: "○",
	}

	return (
		<span
			data-slot="sketch-star"
			data-variant={variant}
			className={cn("inline-block opacity-60", className)}
			style={{
				fontSize: `${size}px`,
				color,
			}}
			aria-hidden="true"
			{...props}
		>
			{symbols[variant]}
		</span>
	)
}

// === Sketch Border Container ===
interface SketchBorderProps extends React.ComponentProps<"div"> {
	roughness?: number
}

function SketchBorder({
	className,
	roughness = 1,
	children,
	...props
}: SketchBorderProps) {
	// Generate organic border radius
	const radius = roughness === 1
		? "255px 15px 225px 15px / 15px 225px 15px 255px"
		: "60% 40% 30% 70% / 60% 30% 70% 40%"

	return (
		<div
			data-slot="sketch-border"
			className={cn("border border-current", className)}
			style={{ borderRadius: radius }}
			{...props}
		>
			{children}
		</div>
	)
}

// === Paper Texture Background ===
interface PaperTextureProps extends React.ComponentProps<"div"> {
	intensity?: "light" | "medium" | "heavy"
}

function PaperTexture({
	className,
	intensity = "light",
	children,
	...props
}: PaperTextureProps) {
	const intensities = {
		light: 0.03,
		medium: 0.05,
		heavy: 0.08,
	}

	return (
		<div
			data-slot="paper-texture"
			className={cn("relative overflow-hidden", className)}
			{...props}
		>
			{children}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${intensities[intensity]}'/%3E%3C/svg%3E")`,
					opacity: 0.4,
				}}
				aria-hidden="true"
			/>
		</div>
	)
}

// === Organic Blob Container ===
interface OrganicBlobProps extends React.ComponentProps<"div"> {
	variant?: "blob" | "leaf" | "cloud"
}

function OrganicBlob({
	className,
	variant = "blob",
	children,
	...props
}: OrganicBlobProps) {
	const shapes = {
		blob: "60% 40% 30% 70% / 60% 30% 70% 40%",
		leaf: "0% 100% 0% 100% / 0% 100% 0% 100%",
		cloud: "50% 50% 50% 50% / 50% 50% 50% 50%",
	}

	return (
		<div
			data-slot="organic-blob"
			data-variant={variant}
			className={cn("overflow-hidden", className)}
			style={{ borderRadius: shapes[variant] }}
			{...props}
		>
			{children}
		</div>
	)
}

// === Floating Animation Wrapper ===
interface FloatingProps extends React.ComponentProps<"div"> {
	delay?: number
	duration?: number
}

function Floating({
	className,
	delay = 0,
	duration = 3,
	children,
	...props
}: FloatingProps) {
	return (
		<div
			data-slot="floating"
			className={cn("inline-block", className)}
			style={{
				animation: `organic-float ${duration}s ease-in-out ${delay}s infinite`,
			}}
			{...props}
		>
			{children}
		</div>
	)
}

// === Hand-drawn Badge ===
interface SketchBadgeProps extends React.ComponentProps<"span"> {
	variant?: "ai" | "feature" | "status"
}

function SketchBadge({
	className,
	variant = "feature",
	children,
	...props
}: SketchBadgeProps) {
	const variantStyles = {
		ai: "bg-primary/10 border-primary text-primary sketch-border px-3 py-1 text-xs font-medium uppercase tracking-wider",
		feature: "bg-secondary-container/30 border-secondary text-on-secondary-container sketch-border px-3 py-1 text-sm font-medium",
		status: "bg-tertiary-container/30 border-tertiary text-on-tertiary-container sketch-border px-2 py-0.5 text-xs",
	}

	return (
		<span
			data-slot="sketch-badge"
			data-variant={variant}
			className={cn("inline-flex items-center gap-1.5", variantStyles[variant], className)}
			{...props}
		>
			{variant === "ai" && <SketchStar variant="sparkle" size={12} />}
			{children}
		</span>
	)
}

// === Sketch Divider ===
interface SketchDividerProps extends React.ComponentProps<"div"> {
	label?: string
}

function SketchDivider({ className, label, ...props }: SketchDividerProps) {
	return (
		<div
			data-slot="sketch-divider"
			className={cn("relative my-8 flex items-center", className)}
			{...props}
		>
			<div className="flex-1 border-t border-current opacity-20" />
			{label && (
				<span className="mx-4 text-sm text-muted-foreground font-display opacity-60">
					{label}
				</span>
			)}
			<div className="flex-1 border-t border-current opacity-20" />
		</div>
	)
}

// === Organic Accent Group ===
interface OrganicAccentsProps extends React.ComponentProps<"div"> {
	accent?: "star" | "arrow" | "dots" | "none"
}

function OrganicAccents({
	className,
	accent = "star",
	children,
	...props
}: OrganicAccentsProps) {
	return (
		<div
			data-slot="organic-accents"
			data-accent={accent}
			className={cn("relative", className)}
			{...props}
		>
			{children}
			{accent === "star" && (
				<>
					<SketchStar className="absolute -top-2 -right-2 animate-pulse" />
					<SketchStar className="absolute -bottom-1 -left-1 text-primary/40" size={12} />
				</>
			)}
			{accent === "arrow" && (
				<SketchArrow className="absolute -right-4 top-1/2 -translate-y-1/2 text-primary/60" />
			)}
			{accent === "dots" && (
				<>
					<SketchStar variant="dot" className="absolute top-0 right-0" size={8} />
					<SketchStar variant="dot" className="absolute bottom-0 left-0" size={6} />
					<SketchStar variant="dot" className="absolute top-1/2 right-0" size={10} />
				</>
			)}
		</div>
	)
}

export {
	SketchUnderline,
	SketchArrow,
	SketchStar,
	SketchBorder,
	PaperTexture,
	OrganicBlob,
	Floating,
	SketchBadge,
	SketchDivider,
	OrganicAccents,
}
