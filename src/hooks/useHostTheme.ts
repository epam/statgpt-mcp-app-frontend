import { useEffect } from "react";
import {
    applyDocumentTheme,
    applyHostStyleVariables,
} from "@modelcontextprotocol/ext-apps";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";

// "__mcp-host-fonts" is the private element ID used by applyHostFonts in the SDK.
// We manage the element directly so font CSS updates are applied on every hostContext
// change, bypassing the SDK's one-shot guard. Verify this ID against
// @modelcontextprotocol/ext-apps/dist/src/app.js if upgrading the SDK.
const FONT_ELEMENT_ID = "__mcp-host-fonts";

export function useHostTheme(hostContext: McpUiHostContext | undefined): void {
    const theme = hostContext?.theme;
    const variables = hostContext?.styles?.variables;
    const fontCss = hostContext?.styles?.css?.fonts;

    useEffect(() => {
        if (!theme) return;
        applyDocumentTheme(theme);
        return () => {
            document.documentElement.removeAttribute("data-theme");
            document.documentElement.style.removeProperty("color-scheme");
        };
    }, [theme]);

    useEffect(() => {
        if (!variables) return;
        applyHostStyleVariables(variables);
        return () => {
            Object.keys(variables).forEach((key) => {
                document.documentElement.style.removeProperty(key);
            });
        };
    }, [variables]);

    useEffect(() => {
        if (!fontCss) return;
        let el = document.getElementById(FONT_ELEMENT_ID) as HTMLStyleElement | null;
        if (!el) {
            el = document.createElement("style");
            el.id = FONT_ELEMENT_ID;
            document.head.appendChild(el);
        }
        el.textContent = fontCss;
        return () => {
            document.getElementById(FONT_ELEMENT_ID)?.remove();
        };
    }, [fontCss]);
}
