import * as React from "react";

/**
 * Minimal tooltip provider stub — just passes children through. Replace with
 * @radix-ui/react-tooltip when real tooltips are needed.
 */
export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
