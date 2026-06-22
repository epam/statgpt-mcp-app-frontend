import { useEffect } from "react";
import {
    applyDocumentTheme,
    applyHostFonts,
    applyHostStyleVariables,
} from "@modelcontextprotocol/ext-apps";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";

export function useHostTheme(hostContext: McpUiHostContext | undefined): void {
    const theme = hostContext?.theme;
    const variables = hostContext?.styles?.variables;
    const fontCss = hostContext?.styles?.css?.fonts;

    useEffect(() => {
        if (theme) applyDocumentTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (variables) applyHostStyleVariables(variables);
    }, [variables]);

    useEffect(() => {
        if (fontCss) applyHostFonts(fontCss);
    }, [fontCss]);
}
