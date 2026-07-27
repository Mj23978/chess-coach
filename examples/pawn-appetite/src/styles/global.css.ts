import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme";

globalStyle("button, [role='button'], .cg-wrap, .mosaic-window-toolbar", {
    userSelect: "none",
    WebkitUserSelect: "none",
});

globalStyle(
    "input, textarea, [contenteditable='true'], pre, code, table, .mantine-Modal-root, .mantine-Drawer-root",
    {
        userSelect: "text",
        WebkitUserSelect: "text",
    },
);

globalStyle(":focus-visible", {
    outline: "2px solid var(--mantine-primary-color-filled)",
    outlineOffset: "2px",
});

globalStyle("[data-density='compact'] .mantine-Tabs-tab", {
    paddingBlock: "0.35rem",
    paddingInline: "0.55rem",
});

globalStyle("[data-density='compact'] .mantine-Button-root", {
    minHeight: "1.75rem",
});

globalStyle("[data-density='compact'] .mantine-Input-input", {
    minHeight: "1.75rem",
});

globalStyle("[data-density='compact'] .mantine-ActionIcon-root", {
    minWidth: "1.75rem",
    minHeight: "1.75rem",
});

globalStyle("[data-density='compact'] .mantine-Card-root", {
    padding: "0.625rem",
});

globalStyle("[data-density='compact'] .mantine-Table-tr, [data-density='compact'] .mantine-DataTable-row", {
    minHeight: "2rem",
});

globalStyle("[data-density='compact'] .mantine-DataTable-table th, [data-density='compact'] .mantine-DataTable-table td", {
    paddingBlock: "0.35rem",
});

globalStyle("*", {
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            scrollBehavior: "auto",
            transitionDuration: "0.01ms !important",
        },
    },
});

globalStyle("html, body", {
    overscrollBehavior: "none",
    overflow: "auto",
});

globalStyle(".mantine-ScrollArea-viewport", {
    overscrollBehavior: "none",
});

globalStyle("cg-board square.selected", {
    [vars.darkSelector]: {
        background: "color-mix(in srgb, var(--mantine-primary-color-5) 50%, transparent)",
    },
    [vars.lightSelector]: {
        background: "color-mix(in srgb, var(--mantine-primary-color-3) 50%, transparent)",
    },
});

globalStyle("cg-board square.move-dest", {
    background: "radial-gradient(rgba(0, 0, 0, 0.3) 25%, rgba(0, 0, 0, 0) 0)",
});

globalStyle("cg-board square.move-dest:hover", {
    [vars.darkSelector]: {
        background:
            "color-mix(in srgb, var(--mantine-primary-color-5) 60%, transparent) !important",
    },
    [vars.lightSelector]: {
        background:
            "color-mix(in srgb, var(--mantine-primary-color-3) 60%, transparent) !important",
    },
    borderRadius: 0,
    padding: 0,
});

globalStyle("cg-board square.oc.move-dest", {
    background: "none",
    border: "5px solid rgba(0, 0, 0, 0.3)",
    borderRadius: 0,
});

globalStyle("cg-board square.oc.move-dest:hover", {
    [vars.darkSelector]: {
        background: "color-mix(in srgb, var(--mantine-primary-color-5) 60%, transparent)",
    },
    [vars.lightSelector]: {
        background: "color-mix(in srgb, var(--mantine-primary-color-3) 60%, transparent)",
    },
    borderRadius: 0,
});
