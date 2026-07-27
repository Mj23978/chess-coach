import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/theme";

export const link = style({
    width: "100%",
    height: "3rem",
    display: "flex",
    alignItems: "center",
    "@media": {
        [`(width >= ${vars.breakpoints.sm})`]: {
            borderLeft: "3px solid transparent",
            borderRight: "3px solid transparent",
        },
        [`(width < ${vars.breakpoints.sm})`]: {
            borderTop: "3px solid transparent",
        },
    },
    justifyContent: "center",
    [vars.lightSelector]: {
        color: vars.colors.gray[7],
    },
    [vars.darkSelector]: {
        color: vars.colors.dark[0],
    },

    ":hover": {
        [vars.lightSelector]: {
            color: vars.colors.dark[5],
        },
        [vars.darkSelector]: {
            color: vars.colors.gray[0],
        },
    },
});

export const navItem = style({
    gap: "0.65rem",
    paddingInline: "0.65rem",
    borderRadius: vars.radius.sm,
    textDecoration: "none",
    justifyContent: "flex-start",
    outline: "none",
    transition: "background-color 120ms ease, color 120ms ease, border-color 120ms ease",
    selectors: {
        "&:focus-visible": {
            boxShadow: "0 0 0 2px var(--mantine-primary-color-filled)",
        },
    },
    ":hover": {
        [vars.lightSelector]: {
            backgroundColor: vars.colors.gray[1],
        },
        [vars.darkSelector]: {
            backgroundColor: vars.colors.dark[6],
        },
    },
});

export const collapsedItem = style({
    width: "3rem",
    paddingInline: 0,
    justifyContent: "center",
});

export const quickAction = style({
    [vars.lightSelector]: {
        color: vars.colors.gray[8],
    },
    [vars.darkSelector]: {
        color: vars.colors.gray[2],
    },
});

export const active = style({
    [vars.lightSelector]: {
        color: vars.colors.dark[5],
    },
    [vars.darkSelector]: {
        color: vars.colors.white,
    },

    "@media": {
        [`(width >= ${vars.breakpoints.sm})`]: {
            borderLeftColor: vars.colors.primary,
        },
        [`(width < ${vars.breakpoints.sm})`]: {
            borderTopColor: vars.colors.primary,
        },
    },
});
