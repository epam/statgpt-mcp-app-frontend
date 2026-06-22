import { useEffect } from "react";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";

export interface HostLayout {
    isFillHeight: boolean;
}

export function useHostLayout(hostContext: McpUiHostContext | undefined): HostLayout {
    const displayMode = hostContext?.displayMode;

    useEffect(() => {
        if (displayMode) {
            document.documentElement.dataset.displayMode = displayMode;
        } else {
            delete document.documentElement.dataset.displayMode;
        }
    }, [displayMode]);

    const containerDimensions = hostContext?.containerDimensions;
    useEffect(() => {
        const dims = containerDimensions as Record<string, number> | undefined;
        const h = dims?.height ?? dims?.maxHeight;
        if (h != null) {
            document.documentElement.style.setProperty('--mcp-container-height', `${h}px`);
        } else {
            document.documentElement.style.removeProperty('--mcp-container-height');
        }
    }, [containerDimensions]);

    return {
        isFillHeight: displayMode === 'pip' || displayMode === 'fullscreen',
    };
}
