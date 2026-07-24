import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * useIsMobile — returns true when the viewport is below the mobile breakpoint.
 *
 * Used by the Sidebar component to switch between desktop (fixed rail) and
 * mobile (Sheet overlay) layouts. SSR-safe: returns false until mounted.
 */
export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
		undefined,
	);

	React.useEffect(() => {
		if (typeof window === "undefined") return;
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		mql.addEventListener("change", onChange);
		onChange();
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return !!isMobile;
}
