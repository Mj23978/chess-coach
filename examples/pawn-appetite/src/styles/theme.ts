// theme.ts
import { createTheme } from "@mantine/core";
import { themeToVars } from "@mantine/vanilla-extract";

// Do not forget to pass theme to MantineProvider
export const theme = createTheme({
    fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontFamilyMonospace: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
    primaryColor: "blue",
    defaultRadius: "sm",
    headings: {
        fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: "700",
    },
    fontSizes: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "0.9375rem",
        lg: "1.0625rem",
        xl: "1.25rem",
    },
});

// CSS variables object, can be access in *.css.ts files
export const vars = themeToVars(theme);
