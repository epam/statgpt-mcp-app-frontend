import { createSpecBridge } from "./specBridge";
import type { HostBridge } from "./types";

export const bridge: HostBridge = createSpecBridge();

export type { HostBridge };
export type { BridgeSnapshot, BridgePhase } from "./types";
