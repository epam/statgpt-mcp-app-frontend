import { createSpecBridge } from "./specBridge";
import { createChatGPTBridge } from "./chatgptBridge";
import type { HostBridge } from "./types";

export const bridge: HostBridge =
  typeof window !== "undefined" && window.openai
    ? createChatGPTBridge()
    : createSpecBridge();

export type { HostBridge };
export type { BridgeSnapshot, BridgePhase } from "./types";
